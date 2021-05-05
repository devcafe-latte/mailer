import { Moment } from 'moment';
import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import sendinBlue from 'nodemailer-sendinblue-transport';
import Mailer from 'nodemailer/lib/mailer';
import { Email } from './mail/Email';

import { MailerError } from './MailerError';
import { MockTransport } from './MockTransport';
import { Serializer } from './Serializer';
import { MailTransportType } from './Settings';
import { SendSmtpEmail, TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from 'sib-api-v3-typescript';

export class Transport {
  id: number = null;
  name: string = null;
  type: MailTransportType = null;
  active: boolean = null;
  weight: number = null;
  default: boolean = null;
  domain?: string = null;

  private _sibClient?: TransactionalEmailsApi = null;
  private _mailer?: Mailer = null;
  sib?: SendInBlueSettings = null;
  mg?: MailgunSettings = null;
  smtp?: SmtpSettings = null;

  isValid() {
    switch (this.type) {
      case MailTransportType.MOCK:
        return true;
      case MailTransportType.MOCK_FAIL:
        return true;
      case MailTransportType.MAILGUN:
        return this.isValidMailgun()
      case MailTransportType.SENDINBLUE:
        return this.isValidSendInBlue()
      case MailTransportType.SMTP:
        return this.isValidSmtp()
      default:
        return false;
    }
  }

  patch(data: any) {
    const allowed = ['name', 'weight', 'default', 'active', 'domain'];
    for (let a of allowed) {
      if (data[a] !== undefined) this[a] = data[a];
    }

    switch (this.type) {
      case MailTransportType.MAILGUN:
        this.mg = { ...this.mg, ...data.mg };
        break;
      case MailTransportType.SENDINBLUE:
        this.sib = { ...this.sib, ...data.sib };
        break;
      case MailTransportType.SMTP:
        this.smtp = { ...this.smtp, ...data.smtp };
        break;
      default:
        break;
    }
  }

  private isValidMailgun() {
    if (!this.mg) return false;
    if (!this.mg.apiKey) return false;
    if (!this.domain) return false;
    if (!this.mg.host) return false;

    return true;
  }

  private isValidSendInBlue() {
    if (!this.sib) return false;
    if (!this.sib.apiKey) return false;
    if (!this.sib.apiUrl) this.sib.apiUrl = SEND_IN_BLUE_DEFAULT_URL;

    return true;
  }

  private isValidSmtp() {
    if (!this.smtp) return false;
    if (!this.smtp.server) return false;
    if (!this.smtp.user) return false;
    if (!this.smtp.pass) return false;
    if (!this.smtp.port) return false;

    return true;
  }

  //Todo, abstract Transports properly so we have different classes for each type.
  send(mail: Email): Promise<any> {
    const nodemailerTransports = [
      MailTransportType.SMTP,
      MailTransportType.MAILGUN,
      MailTransportType.MOCK,
      MailTransportType.MOCK_FAIL,
    ];


    if (this.type === MailTransportType.SENDINBLUE) return this.sendWithSendinblue(mail);

    //Default to sending with Nodemailer
    return this.sendWithNodemailer(mail);
  }

  private async sendWithSendinblue(mail: Email): Promise<any> {
    if (!this._sibClient) {
      //Note, If we ever want to use the url, we should change that here.
      // Right now, it doesn't seem like there's any reason to change the url, so we don't set it.
      this._sibClient = new TransactionalEmailsApi();
      this._sibClient.setApiKey(TransactionalEmailsApiApiKeys.apiKey, this.sib.apiKey);
    }

    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.subject = mail.subject;
    if (!mail.html && mail.text) {
      //Sendinblue  throws a shitfit is there's no html content, because why not...
      mail.html = mail.text.replace("\n", "<br>\n");
    }
    sendSmtpEmail.textContent = mail.text;
    sendSmtpEmail.htmlContent = mail.html;

    
    const from = Email.stringToAddres(mail.from);
    sendSmtpEmail.sender = { name: from.name, email: from.address };

    const to = Email.stringToAddres(mail.to);
    sendSmtpEmail.to = [{ name: to.name, email: to.address }];

    if (mail.replyTo) {
      const replyTo = Email.stringToAddres(mail.replyTo);
      sendSmtpEmail.replyTo = { name: replyTo.name, email: replyTo.address };
    }

    return await this._sibClient.sendTransacEmail(sendSmtpEmail);
  }

  getMailer() {
    if (!this._mailer) {
      if (this.type === MailTransportType.SMTP) {
        if (!this.smtp) throw MailerError.new("Missing settings for SMTP", 500);

        this._mailer = nodemailer.createTransport({
          host: this.smtp.server,
          port: this.smtp.port,
          auth: {
            user: this.smtp.user,
            pass: this.smtp.pass
          },
          secure: this.smtp.secure
        });
      } else if (this.type === MailTransportType.MOCK) {
        this._mailer = nodemailer.createTransport(new MockTransport());
      } else if (this.type === MailTransportType.MOCK_FAIL) {
        this._mailer = nodemailer.createTransport(new MockTransport(true));
      } else if (this.type === MailTransportType.MAILGUN) {
        if (!this.mg) throw MailerError.new("Missing settings for Mailgun", 500);
        const options = {
          auth: {
            api_key: this.mg.apiKey,
            domain: this.domain,
          },
          host: this.mg.host,
        }
        this._mailer = nodemailer.createTransport(mg(options));
      } else {
        throw "Unknown Transport: " + this.type;
      }
    }

    return this._mailer;
  }

  private sendWithNodemailer(mail: Email): Promise<any> {
    const mailer = this.getMailer();
    return mailer.sendMail(mail.toNodeMailerMail());
  }

  static deserialize(data: any): Transport {
    return Serializer.deserialize(Transport, data);
  }
}

/** @deprecated Not used currently */
export const SEND_IN_BLUE_DEFAULT_URL = 'https://api.sendinblue.com/v3';

export type settingsType = SendInBlueSettings | MailgunSettings | SmtpSettings;

export interface SendInBlueSettings extends TransportSettings {
  apiKey: string;
  apiUrl: string;
}

export interface MailgunSettings extends TransportSettings {
  apiKey: string;
  host: string;
}

export interface SmtpSettings extends TransportSettings {
  server: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

export interface TransportSettings {
  id?: number;
  transportId?: number;
}

export class TransportStats {
  start: Moment = null;
  end: Moment = null;
  stats: TransportStat[] = [];
}

export interface TransportStat {
  transportId: number;
  count: number;
}