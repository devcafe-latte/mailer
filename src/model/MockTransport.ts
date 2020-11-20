import MailMessage = require("nodemailer/lib/mailer/mail-message");

export class MockTransport {
  name: "Mock Transport";
  version: "1.0";

  shouldError = false;
  errorMessage = "Mock error thrown";

  sent: any[] = [];

  send(mail: MailMessage, callback: Function) {
    if (this.shouldError) throw this.errorMessage;
    callback(null, { message: "Mock Transport says Hi!" });    
  }

  close() {
    //Nothing to do.
  }

  isIdle(): boolean {
    return true;
  }
}