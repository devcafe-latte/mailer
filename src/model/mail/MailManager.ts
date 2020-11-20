import moment from 'moment';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import mg from 'nodemailer-mailgun-transport';
import sendinBlue from 'nodemailer-sendinblue-transport';

import container from '../DiContainer';
import { MailerError } from '../MailerError';
import { Email, EmailContent, MailStatus, MailTemplate, EmailTemplateContent } from './Email';
import { MockTransport } from '../MockTransport';


export class MailManager {
  static BACKOFF_DELAY_MINUTES = 5;

  private _mailer: Mail;

  constructor() { }

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

  private async addTemplate(mc: EmailTemplateContent) {
    if (!mc.template) return;

    const t = await container.db.getRow<MailTemplate>("SELECT * FROM `template` WHERE name = ? AND language = ?", [mc.template, mc.language]);
    if (!t) throw MailerError.new(`Template not found: ${mc.template} lang: ${mc.language}`, 400)
    mc.subject = t.subject;
    mc.html = t.html;
    mc.text = t.text;

    this.interpolate(mc);
  }

  private interpolate(m: EmailTemplateContent) {
    if (!m.params) return;

    for (let key of Object.getOwnPropertyNames(m.params)) {
      const regex = new RegExp(`({{\ ?${key}\ ?}})`, 'g');

      if (m.subject) m.subject = m.subject.replace(regex, m.params[key]);
      if (m.text) m.text = m.text.replace(regex, m.params[key]);
      if (m.html) m.html = m.html.replace(regex, m.params[key]);
    }

  }

  async sendMailFromTemplate(mc: EmailTemplateContent, sendImmediately = true): Promise<any> {
    await this.addTemplate(mc);
    if (sendImmediately) {
      return this.sendMail(mc);
    } else {
      return this.queueMail(mc);
    }
  }

  async sendMail(mailContent: EmailContent): Promise<any> {
    const mail = Email.fromMailContent(mailContent);
    const errors = [];
    if (!mail.isValid(errors)) throw MailerError.new("Mail content invalid. \n" + errors.join("\n"), 400);

    await container.db.insert(mail);

    return await this.trySend(mail);
  }

  async queueMail(mailContent: EmailContent): Promise<Email> {
    const mail = Email.fromMailContent(mailContent);
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
      const result = await this.getMailer().sendMail(mail);
      result.success = true;

      //todo Check if it's actually sent.

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

  private getMailer() {
    if (!this._mailer && container.settings.mailTransport === "smtp" && container.settings.smtpServer === 'notset') {
      throw "SMTP server not set.";
    }

    if (!this._mailer) {

      if (container.settings.mailTransport === "smtp") {
        this._mailer = nodemailer.createTransport({
          host: container.settings.smtpServer,
          port: container.settings.smtpPort,
          auth: {
            user: container.settings.smtpUser,
            pass: container.settings.smtpPass
          },
          secure: container.settings.smtpSecure
        });
      } else if (container.settings.mailTransport === "mock") {
        this._mailer = nodemailer.createTransport(new MockTransport());
      } else if (container.settings.mailTransport === "sendinblue") {
        this._mailer = nodemailer.createTransport(sendinBlue(container.settings.sendinBlue));
      } else if (container.settings.mailTransport === "mailgun") {
        const options = {
          auth: {
            api_key: container.settings.mailgunApiKey,
            domain: container.settings.mailgunDomain,
          },
          host: 'api.eu.mailgun.net',
        }
        this._mailer = nodemailer.createTransport(mg(options));
      } else {
        throw "Unknown Transport: " + container.settings.mailTransport;
      }

    }

    return this._mailer;
  }
}

export interface ProcessResult {
  successes: number;
  failures: number;
  //todo maybe consider permanent vs temp failures.
}

export interface EmailPage {
  emails: Email[];
  lastPage: number;
  perPage: number;
  currentPage: number;
}