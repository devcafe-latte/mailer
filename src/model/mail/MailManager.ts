import moment from 'moment';

import container from '../DiContainer';
import { MailerError } from '../MailerError';
import { Email, EmailContent, MailStatus, MailTemplate } from './Email';


export class MailManager {
  static BACKOFF_DELAY_MINUTES = 5;

  constructor() { }

  async getTemplates(): Promise<MailTemplate[]> {
    const sql = "SELECT * FROM `template`";
    return await container.db.getRows<MailTemplate>(sql, []);
  }

  async saveTemplate(t: MailTemplate): Promise<MailTemplate> {
    t.id = null;
    if (!t.language) t.language = container.settings.defaults.language;
    const existing = await this.getTemplate(t.name, t.language);
    if (existing) throw MailerError.new('template-already-exists', 400);

    await container.db.insert(t, 'template');
    return t;
  }

  async updateTemplate(t: Partial<MailTemplate>): Promise<MailTemplate> {
    if (!t.name) throw MailerError.new("Missing template name");

    if (!t.language) t.language = container.settings.defaults.language;
    const existing = await this.getTemplate(t.name, t.language);
    if (!existing) throw MailerError.new('template-not-found', 404);

    t.id = existing.id;
    await container.db.update({ object: t, table: 'template', column: 'id' });

    Object.assign(existing, t);

    return existing;
  }

  async removeTemplate(name: string, language?: string) {
    if (!language) language = container.settings.defaults.language;
    const existing = await this.getTemplate(name, language);
    if (!existing) throw MailerError.new('template-not-found', 404);

    await container.db.delete('template', existing.id);

  }

  private async getTemplate(name: string, lang?: string) {
    if (!lang) lang = container.settings.defaults.language;

    const sql = "SELECT * FROM `template` WHERE name = ? AND language = ?";
    return await container.db.getRow<MailTemplate>(sql, [name, lang]);
  }

  async getEmails(currentPage = 0, perPage = 25): Promise<EmailPage> {

    const sql = [
      "SELECT * FROM `email`",
      "ORDER BY `id` DESC",
      "LIMIT ? OFFSET ?",
    ].join("\n");

    const offset = currentPage * perPage;
    const emails = await container.db.getRows<Email>(sql, [perPage, offset], Email);

    const emailCount = await container.db.getValue("SELECT count(id) FROM `email`");
    const lastPage = emailCount ? Math.ceil(emailCount / perPage) - 1 : 0;

    return { emails, perPage, currentPage, lastPage };
  }

  private async addTemplate(mc: EmailContent) {
    if (!mc.template) return;
    if (!mc.language) mc.language = container.settings.defaults.language;

    const t = await container.db.getRow<MailTemplate>("SELECT * FROM `template` WHERE name = ? AND language = ?", [mc.template, mc.language]);
    if (!t) throw MailerError.new(`Template not found: ${mc.template} lang: ${mc.language}`, 400)
    mc.subject = t.subject;
    mc.html = t.html;
    mc.text = t.text;

    this.interpolate(mc);
  }

  private interpolate(m: EmailContent) {
    if (!m.params) return;

    for (let key of Object.getOwnPropertyNames(m.params)) {
      const regex = new RegExp(`({{\ ?${key}\ ?}})`, 'g');

      if (m.subject) m.subject = m.subject.replace(regex, m.params[key]);
      if (m.text) m.text = m.text.replace(regex, m.params[key]);
      if (m.html) m.html = m.html.replace(regex, m.params[key]);
    }

  }

  async sendMailFromTemplate(mc: EmailContent, sendImmediately = true): Promise<any> {
    await this.addTemplate(mc);
    if (sendImmediately) {
      return this.sendMail(mc);
    } else {
      return this.queueMail(mc);
    }
  }

  async sendMail(mailContent: EmailContent): Promise<any> {
    const mail = Email.fromMailContent(mailContent, container.settings.defaults);
    const errors = [];
    if (!mail.isValid(errors)) throw MailerError.new("Mail content invalid. \n" + errors.join("\n"), 400);

    await container.db.insert(mail);

    await container.tm.reloadTransports();
    return await this.trySend(mail);
  }

  async queueMail(mailContent: EmailContent): Promise<Email> {
    const mail = Email.fromMailContent(mailContent, container.settings.defaults);
    mail.retryAfter = moment().subtract(1, 'second');

    const errors = [];
    if (!mail.isValid(errors)) throw MailerError.new("Mail content invalid. \n" + errors.join("\n"), 400);

    await container.db.insert(mail);

    return mail;
  }

  async processQueue(): Promise<ProcessResult> {
    const sql = [
      "SELECT *",
      "FROM `email`",
      "WHERE `retryAfter` < ? AND `status` = 'pending'"
    ].join("\n");
    const mails = await container.db.getRows<Email>(sql, [moment().unix()], Email);

    let successes = 0;
    let failures = 0;

    await container.tm.reloadTransports();

    for (let m of mails) {
      const result = await this.trySend(m);
      if (result.success) {
        successes++;
      } else {
        failures++;
      }
    }
    return { successes, failures };
  }

  private async trySend(mail: Email) {
    try {
      const t = await container.tm.getTransport(mail.transportId);
      mail.transportId = t.id;
      mail.setFromDomain(t.domain);

      const result = await t.getMailer().sendMail(mail.toNodeMailerMail());
      result.success = true;

      mail.sent = moment();
      mail.status = MailStatus.SENT;
      mail.retryAfter = null;
      mail.error = null;
      await container.db.update({ object: mail, column: "id", keepNulls: true });

      return result;

    } catch (err) {
      console.log("Couldn't send email", err);

      //Update attempt and set new retry time
      mail.attempt++;
      if (mail.attempt >= mail.maxRetries) {
        mail.retryAfter = null;
        mail.status = MailStatus.FAILED;
      } else {
        mail.retryAfter = moment().add(MailManager.BACKOFF_DELAY_MINUTES * mail.attempt, "minutes");
      }

      //Log the error
      if (typeof err === "string") {
        mail.error = err;
      } else {
        mail.error = JSON.stringify(err);
      }

      await container.db.update({ object: mail, keepNulls: true, column: 'id' });
      return { success: false, error: err };
    }
  }
}

export interface ProcessResult {
  successes: number;
  failures: number;
}

export interface EmailPage {
  emails: Email[];
  lastPage: number;
  perPage: number;
  currentPage: number;
}