export class MailerError {

  message: string;
  status: number;

  static new(message: string, status = 500): MailerError {

    const e = new MailerError();
    e.message = message;
    e.status = status;

    return e;
  }

  toString() {
    return `[${this.status}] ${this.message}`;
  }
}