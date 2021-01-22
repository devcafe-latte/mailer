import { MailTransportType } from './Settings';
import Mailer from 'nodemailer/lib/mailer';
import nodemailer from 'nodemailer';
import { MailerError } from './MailerError';
import { MockTransport } from './MockTransport';
import sendinBlue from 'nodemailer-sendinblue-transport';
import mg, { MailgunTransport } from 'nodemailer-mailgun-transport';
import { toObject } from './helpers';
import mailgunTransport from 'nodemailer-mailgun-transport';

export class Transport {
  id: number = null;
  name: string = null;
  type: MailTransportType = null;
  active: boolean = null;
  weight: number = null;
  default: boolean = null;

  private _mailer?: Mailer = null;
  sib?: SendInBlueSettings = null;
  mg?: MailgunSettings = null;
  smtp?: SmtpSettings = null;

  isValid() {
    switch (this.type) {
      case MailTransportType.MOCK:
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

  private isValidMailgun() {
    if (!this.mg) return false;
    if (!this.mg.apiKey) return false;
    if (!this.mg.domain) return false;
    if (!this.mg.host) return false;

    return true;
  }

  private isValidSendInBlue() {
    if (!this.sib)return false;
    if (!this.sib.apiKey) return false;
    if (!this.sib.apiUrl) return false;

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

  getMailer(): Mailer {
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
      } else if (this.type === MailTransportType.SENDINBLUE) {
        if (!this.sib) throw MailerError.new("Missing settings for Send In Blue", 500);
        this._mailer = nodemailer.createTransport(sendinBlue(this.sib));
      } else if (this.type === MailTransportType.MAILGUN) {
        if (!this.mg) throw MailerError.new("Missing settings for Mailgun", 500);
        const options: mailgunTransport.Options = {
          auth: {
            api_key: this.mg.apiKey,
            domain: this.mg.domain,
          },
          host: this.mg.host,
        }
        console.log("Mailgun settings", this.mg, options);
        this._mailer = nodemailer.createTransport(mg(options));
      } else {
        throw "Unknown Transport: " + this.type;
      }
    }

    return this._mailer;
  }

  static deserialize(data: any): Transport {
    let t = toObject<Transport>(Transport, data);

    return t;
  }
}

export type settingsType = SendInBlueSettings | MailgunSettings | SmtpSettings;

export interface SendInBlueSettings extends TransportSettings {
  apiKey: string;
  apiUrl: string;
}

export interface MailgunSettings extends TransportSettings {
  apiKey: string;
  domain: string;
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