import { Address } from './mail/Email';
import { MailgunSettings, SendInBlueSettings, SmtpSettings } from './Transport';

export class Settings {
  debug: boolean = (process.env.NODE_ENV !== "production");

  port: number = Number(process.env.PORT) || 3010;
  dbHost: string = process.env.DB_HOST || 'localhost';
  dbUser: string = process.env.DB_USER || 'root';
  dbPass: string = process.env.DB_PASS || '';
  dbPort: number = Number(process.env.DB_PORT) || 3306;
  dbName: string = process.env.DB_NAME || 'mailer';

  defaults: DefaultMailSettings = {
    from: {
      address: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
      name: process.env.DEFAULT_FROM_NAME || undefined,
    },
    language: process.env.DEFAULT_LANG || 'en',
  };

  /* deprecated */
  mailTransport: MailTransportType;

  /* deprecated */
  smtp: SmtpSettings = {
    server: process.env.SMTP_SERVER || 'notset',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
    secure: true,
  }

  /* deprecated */
  mailgun: MailgunSettings = {
    apiKey: process.env.MAILGUN_API_KEY || 'notakey',
    domain: process.env.MAILGUN_DOMAIN || 'mg.example.com',
    host: process.env.MAILGUN_HOST || 'api.eu.mailgun.net',
  }

  /* deprecated */
  sendInBlue: SendInBlueSettings = {
    apiKey: process.env.SENDINBLUE_API_KEY || 'notakey',
    apiUrl: process.env.SENDINBLUE_URL || 'https://api.sendinblue.com/v2.0',
  };

  constructor() {
    this.smtp.secure = this.getBoolValue(process.env.SMTP_SECURE);
    this.getTransportType();
  }

  private getBoolValue(value: any): boolean {
    if (value === undefined) return true;
    if (value === "1") return true;
    if (value === "true") return true;

    return false;
  }

  private getTransportType() {
    const def = MailTransportType.SMTP;

    const setting: any = process.env.MAIL_TRANSPORT;

    if (Object.values(MailTransportType).includes(setting)) {
      this.mailTransport = setting;
    } else {
      this.mailTransport = def;
    }
  }
};

export enum MailTransportType {
  MOCK = "mock",
  MAILGUN = "mailgun",
  SENDINBLUE = "sendinblue",
  SMTP = "smtp",
  WEIGHTED = "weighted",
}

export interface DefaultMailSettings {
  from: Address;
  language: string;
}