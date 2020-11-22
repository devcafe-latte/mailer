import { Address } from './mail/Email';
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

  mailTransport = process.env.MAIL_TRANSPORT || 'smtp';

  smtpServer = process.env.SMTP_SERVER || 'notset';
  smtpPort = Number(process.env.SMTP_PORT) || 465;
  smtpUser = process.env.SMTP_USER || 'user';
  smtpPass = process.env.SMTP_PASS || 'pass';
  smtpSecure: boolean;

  mailgunApiKey = process.env.MAILGUN_API_KEY || 'notakey';
  mailgunDomain = process.env.MAILGUN_DOMAIN || 'mg.example.com';
  mailgunHost = process.env.MAILGUN_HOST || 'api.eu.mailgun.net';

  sendinBlue = {
    apiKey: process.env.SENDINBLUE_API_KEY || 'notakey',
    apiUrl: process.env.SENDINBLUE_URL || 'https://api.sendinblue.com/v2.0',
  };

  constructor() {
    this.smtpSecure = this.getBoolValue(process.env.SMTP_SECURE);
  }

  private getBoolValue(value: any): boolean {
    if (value === undefined) return true;
    if (value === "1") return true;
    if (value === "true") return true;

    return false;
  }
};

export interface DefaultMailSettings {
  from: Address;
  language: string;
}