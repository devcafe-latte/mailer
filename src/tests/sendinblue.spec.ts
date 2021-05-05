import container from '../model/DiContainer';
import { Email, EmailContent, MailStatus } from '../model/mail/Email';
import { MailManager } from '../model/mail/MailManager';
import { MailTransportType } from '../model/Settings';
import { TestHelper } from './TestHelper';

describe('Send using Sendinblue', () => {
  let th: TestHelper;
  let mm: MailManager;
  const mailContent: EmailContent = {
    to: "Coo van Leeuwen <c00yt825@gmail.com>",
    from: "Ya Boi Testy McTestFace <noreply@xn--berbrckungshilfe-studierende-06cf.de>",
    subject: "[Mailer] SendInBlue is working",
    text: "Shall this pass too?",
    html: "<h5>Shall this pass too?</h5> <p>bluppy <strong>strong</strong></p>"
  };

  beforeEach(async (done) => {
    th = await TestHelper.new();
    await th.setAsOnlyMailer(MailTransportType.SENDINBLUE)
    mm = container.mailer;

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it('Send SendInBlue Mail normal', async (done) => {
    const result = await mm.sendMail(mailContent)
    expect(result).not.toBeNull();
    expect(result.success).toBe(true);

    const email = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(email.error).toBeNull();
    expect(email.retryAfter).toBeNull();
    expect(email.sent).not.toBeNull();
    expect(email.status).toBe(MailStatus.SENT);

    done();
  });

  it('Send SendInBlue Mail with template', async (done) => {
    const cont: EmailContent = { ...mailContent, template: "test-template-1", language: "en", params: { foo: 'a thing', bar: 'another thing', baz: 'baz of course' } };
    const result = await mm.sendMailFromTemplate(cont)
    expect(result).not.toBeNull();
    expect(result.success).toBe(true);

    const email = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(email.error).toBeNull();
    expect(email.retryAfter).toBeNull();
    expect(email.sent).not.toBeNull();
    expect(email.status).toBe(MailStatus.SENT);

    done();
  });

});