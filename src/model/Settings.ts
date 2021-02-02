import { Address } from './mail/Email';
import { MailgunSettings, SendInBlueSettings, SmtpSettings, SEND_IN_BLUE_DEFAULT_URL } from './Transport';
import { getEnum, getBoolValue } from './helpers';

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

  /* Used for built-in sttings */
  mailTransport: MailTransportType = getEnum(MailTransportType, process.env.MAIL_TRANSPORT, MailTransportType.SMTP) as MailTransportType;

  domain = process.env.MAILGUN_DOMAIN || 'mg.example.com';

  smtp: SmtpSettings = {
    server: process.env.SMTP_SERVER || 'notset',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
    secure: getBoolValue(process.env.SMTP_SECURE, true),
  }

  mailgun: MailgunSettings = {
    apiKey: process.env.MAILGUN_API_KEY || 'notakey',
    host: process.env.MAILGUN_HOST || 'api.eu.mailgun.net',
  }

  sendInBlue: SendInBlueSettings = {
    apiKey: process.env.SENDINBLUE_API_KEY || 'notakey',
    apiUrl: process.env.SENDINBLUE_URL || SEND_IN_BLUE_DEFAULT_URL,
  };

  constructor() {}

};

export enum MailTransportType {
  MOCK = "mock",
  MOCK_FAIL = "mock-fail",
  MAILGUN = "mailgun",
  SENDINBLUE = "sendinblue",
  SMTP = "smtp",
}

export interface DefaultMailSettings {
  from: Address;
  language: string;
}