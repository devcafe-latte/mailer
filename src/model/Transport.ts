import { MailTransportType } from './Settings';
import Mailer from 'nodemailer/lib/mailer';
import nodemailer from 'nodemailer';
import { MailerError } from './MailerError';
import { MockTransport } from './MockTransport';
import sendinBlue from 'nodemailer-sendinblue-transport';
import mg from 'nodemailer-mailgun-transport';

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
        const options = {
          auth: {
            api_key: this.mg.apiKey,
            domain: this.mg.domain,
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
}

export interface SendInBlueSettings {
  id?: number;
  transportId?: number;
  apiKey: string;
  apiUrl: string;
}

export interface MailgunSettings {
  id?: number;
  transportId?: number;
  apiKey: string;
  domain: string;
  host: string;
}

export interface SmtpSettings {
  id?: number;
  transportId?: number;
  server: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}