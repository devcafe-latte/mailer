import { DataGenerator } from '../model/DataGenerator';
import container from '../model/DiContainer';
import { Email, EmailContent, MailStatus, EmailTemplateContent } from '../model/mail/Email';
import { MailManager } from '../model/mail/MailManager';
import { MockTransport } from '../model/MockTransport';
import { TestHelper } from './TestHelper';

process.env.MAIL_TRANSPORT = "mock";

describe('Basic Sending of messages', () => {

  let th: TestHelper;
  let mm: MailManager;
  const mailContent: EmailContent = {
    to: "Coo van Leeuwen <Coo@covle.com>",
    from: "Jacky D <Jack@covle.com>",
    subject: "Do you need a drink?",
    text: "Test 123",
    html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
  };
  //let dg = new DataGenerator();

  beforeEach(async (done) => {
    th = await TestHelper.new();
    mm = container.mailer;

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it('tries to send an email without settings', async (done) => {
    container.settings.smtpServer = "notset";
    container.settings.mailTransport = "smtp";

    const result = await mm.sendMail(mailContent)
    expect(result).not.toBeNull();
    expect(result.success).toBe(false);
    expect(result.error).toContain("SMTP server not set.");

    const email = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(email.error).toContain("server not set");
    expect(email.retryAfter).not.toBeNull();
    expect(email.sent).toBeNull();
    expect(email.status).toBe(MailStatus.PENDING);

    done();
  });

  it('sends an email', async (done) => {
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

});

describe('Templates', () => {

  let th: TestHelper;
  let mm: MailManager;

  const mailContent: EmailTemplateContent = {
    to: "Coo van Leeuwen <Coo@covle.com>",
    from: "Jacky D <Jack@covle.com>",
    template: "test-template-1",
    language: "en",
    subject: null,
    text: null,
    params: {
      foo: 'bucket',
      bar: 'Star',
      baz: 'Krabs',
    }
  };

  beforeEach(async (done) => {
    th = await TestHelper.new();
    mm = container.mailer;

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it('sends an email with template', async (done) => {
    const result = await mm.sendMailFromTemplate(mailContent)
    expect(result).not.toBeNull();
    expect(result.success).toBe(true);

    const email = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(email.error).toBeNull();
    expect(email.retryAfter).toBeNull();
    expect(email.sent).not.toBeNull();
    expect(email.status).toBe(MailStatus.SENT);

    done();
  });

  it('Queue an Email', async (done) => {
    //note: Will only be an email when second param is false.
    const result: Email = await mm.sendMailFromTemplate(mailContent, false);

    expect(result.subject).toBe("I live in a giant bucket.");
    expect(result.text).toContain("Text");
    expect(result.text).toContain("bucket");
    expect(result.text).toContain("Star");
    expect(result.text).toContain("Krabs");
    expect(result.html).toContain("html");
    expect(result.html).toContain("bucket");
    expect(result.html).toContain("Star");
    expect(result.html).toContain("Krabs");

    done();
  });
});

describe('Queueing and Processing', () => {

  let th: TestHelper;
  let mm: MailManager;
  const mailContent: EmailContent = {
    to: "Coo van Leeuwen <Coo@covle.com>",
    from: "Jacky D <Jack@covle.com>",
    subject: "Do you need a drink?",
    text: "Test 123",
    html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
  };
  //let dg = new DataGenerator();

  beforeEach(async (done) => {
    th = await TestHelper.new();
    mm = container.mailer;

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it('Queue new mail', async (done) => {
    const m = await mm.queueMail(mailContent);
    expect(m.id).toBe(1);
    const gotten = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(m.serialize()).toEqual(gotten.serialize());

    done();
  });

  it('Queue new mail with replyTo', async (done) => {
    const content: EmailContent = {...mailContent, replyTo: { name: "karel", address: "karel@example.com"} };

    const m = await mm.queueMail(content);
    expect(m.id).toBe(1);
    const gotten = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = ?", [1], Email);
    expect(m.serialize()).toEqual(gotten.serialize());

    expect(gotten.replyTo).toBe("karel <karel@example.com>");

    done();
  });

  it('Processes an mail', async (done) => {
    const m = await mm.queueMail(mailContent);

    let result = await container.mailer.processQueue();
    expect(result.successes).toBe(1);
    expect(result.failures).toBe(0);

    result = await container.mailer.processQueue();
    expect(result.successes).toBe(0);
    expect(result.failures).toBe(0);

    done();
  });

  it('Processes an mail with replyTo', async (done) => {
    const content: EmailContent = {...mailContent, replyTo: { name: "karel", address: "karel@example.com"} };

    const m = await mm.queueMail(content);

    let result = await container.mailer.processQueue();
    expect(result.successes).toBe(1);
    expect(result.failures).toBe(0);

    done();
  });

  it('Processes until failure', async (done) => {
    const m = await mm.queueMail(mailContent);
    const hacky: any = mm['getMailer']();
    const mock: MockTransport = hacky.transporter;

    mock.shouldError = true;


    //Try to process 10 times.
    for (let i = 0; i < 10; i++) {
      //reset date
      await container.db.update({ object: { retryAfter: 0, id: 1 }, table: 'email', column: 'id' });

      const result = await container.mailer.processQueue();
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(1);
    }

    //Should be permanently failed now.
    const result = await container.mailer.processQueue();
    await container.mailer.processQueue();
    expect(result.successes).toBe(0);
    expect(result.failures).toBe(0);

    //Check mail
    const mail = await container.db.getRow<Email>("SELECT * FROM `email` WHERE id = 1", [], Email);
    expect(mail.sent).toBeNull();
    expect(mail.status).toBe(MailStatus.FAILED);
    expect(mail.retryAfter).toBeNull();
    expect(mail.attempt).toBe(mail.maxRetries);

    done();
  });

});

describe('Getting emails', () => {

  let th: TestHelper;
  let mm: MailManager;
  let dg = new DataGenerator();

  beforeEach(async (done) => {
    th = await TestHelper.new();
    mm = container.mailer;

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("Gets emails", async (done) => {
    const input: Email[] = [];
    for (let i = 0; i < 10; i++) {
      input.push(dg.getEmail(i));
    }
    await container.db.insert(input);

    const count = Number(await container.db.getValue("SELECT COUNT(*) FROM `email`"));
    expect(count).toBe(10, "Emails should be inserted");

    //By default, this will get all
    const emailPage = await mm.getEmails();
    expect(emailPage.currentPage).toBe(0);
    expect(emailPage.lastPage).toBe(0);
    expect(emailPage.perPage).toBe(25);
    expect(emailPage.emails.length).toBe(10);

    expect(emailPage.emails[0].constructor.name).toBe("Email");
    expect(emailPage.emails[0].created.constructor.name).toBe("Moment");
    
    done();
  });

  it("Gets emails with paging", async (done) => {
    const input: Email[] = [];
    for (let i = 0; i < 100; i++) {
      input.push(dg.getEmail(i));
    }
    await container.db.insert(input);

    //By default, this will get all
    const firstPage = await mm.getEmails(0);
    expect(firstPage.currentPage).toBe(0);
    expect(firstPage.lastPage).toBe(3);
    expect(firstPage.perPage).toBe(25);
    expect(firstPage.emails.length).toBe(25);

    expect(firstPage.emails[0].id).toBe(100);
    expect(firstPage.emails[24].id).toBe(76);
    

    const secondPage = await mm.getEmails(1);
    expect(secondPage.currentPage).toBe(1);
    expect(secondPage.lastPage).toBe(3);
    expect(secondPage.perPage).toBe(25);
    expect(secondPage.emails.length).toBe(25);

    expect(secondPage.emails[0].id).toBe(75);
    expect(secondPage.emails[24].id).toBe(51);
    
    done();
  });

  it("Gets emails with paging, custom page size", async (done) => {
    const input: Email[] = [];
    for (let i = 0; i < 100; i++) {
      input.push(dg.getEmail(i));
    }
    await container.db.insert(input);

    //By default, this will get all
    const page = await mm.getEmails(2, 10);
    expect(page.currentPage).toBe(2);
    expect(page.lastPage).toBe(9);
    expect(page.perPage).toBe(10);
    expect(page.emails.length).toBe(10);

    expect(page.emails[0].id).toBe(80);
    expect(page.emails[9].id).toBe(71);
    
    done();
  });

});