import request from 'supertest';

import { TestHelper } from './TestHelper';
import { EmailContent, Email } from '../model/mail/Email';
import container from '../model/DiContainer';
import { mailer } from '../Mailer';
import { DataGenerator } from '../model/DataGenerator';

TestHelper.setTestEnv();

describe("Mailer - Public Api", () => {
  let th: TestHelper;

  beforeEach(async (done) => {
    th = await TestHelper.new();

    done();
  });

  afterEach(async (done) => {
    await th.shutdown();

    done();
  });

  it("tests Status", async (done) => {
    const s = container.settings;
    const result = await request(mailer.app).get("/")
      .expect(200);
    const body = result.body;
    expect(body.database).toBe("ok");
    expect(body.express).toBe("ok");
    expect(body.status).toBe("ok");

    done();
  });

  it("Checks 404", async (done) => {
    await request(mailer.app).get("/not-a-real-url")
      .expect(404);
    done();
  });

  it("Posts a new mail", async (done) => {
    const mailContent: EmailContent = {
      to: "Testy McTestFace <testy@covle.com>",
      from: "Jacky D <Jack@covle.com>",
      subject: "Automated test",
      text: "test 123 test strong",
      html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
    };

    const result = await request(mailer.app).post("/email")
      .send(mailContent)
      .expect(200);

    const body = result.body;
    expect(body.result).toBe("ok");

    done();
  });


  it("Posts a new mail with template", async (done) => {
    const mailContent = {
      to: "Testy McTestFace <testy@covle.com>",
      from: "Jacky D <Jack@covle.com>",
      template: "test-template-1",
      language: 'en',
      params: {
        foo: 'bucket',
        bar: 'Star',
        baz: 'Krabs',
      }
    };

    const result = await request(mailer.app).post("/email-from-template")
      .send(mailContent)
      .expect(200);

    const body = result.body;
    expect(body.result).toBe("ok");

    done();
  });

  it("Posts a new mail with template, no params", async (done) => {
    const mailContent = {
      to: "Testy McTestFace <testy@covle.com>",
      from: "Jacky D <Jack@covle.com>",
      template: "test-template-1",
      language: 'en',
    };

    const result = await request(mailer.app).post("/email-from-template")
      .send(mailContent)
      .expect(200);

    const body = result.body;
    expect(body.result).toBe("ok");

    done();
  });

  it("Posts a new mail with template, broken", async (done) => {
    const mailContent = {
      to: "Testy McTestFace <testy@covle.com>",
      from: "Jacky D <Jack@covle.com>",
      template: "nope",
      language: 'en',
    };

    //Wrong template name
    await request(mailer.app).post("/email-from-template")
      .send(mailContent)
      .expect(400);

    mailContent.template = "test-template-1";
    mailContent.language = "eqyptian";

    //Wrong language
    await request(mailer.app).post("/email-from-template")
      .send(mailContent)
      .expect(400);

    done();
  });


  it("Posts with missing subject", async (done) => {
    const mailContent: any = {
      to: "Testy McTestFace <testy@covle.com>",
      from: "Jacky D <Jack@covle.com>",
      // no subject
      text: "test 123 test strong",
      html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
    };

    const result = await request(mailer.app).post("/email")
      .send(mailContent)
      .expect(400);

    const body = result.body;
    expect(body.reason).toContain("Missing arguments");

    done();
  });

  it("Posts with invalid email", async (done) => {
    const mailContent: EmailContent = {
      to: "notanemail",
      from: "Jacky D <Jack@covle.com>",
      subject: "blup",
      text: "test 123 test strong",
      html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
    };

    const result = await request(mailer.app).post("/email")
      .send(mailContent)
      .expect(400);

    const body = result.body;
    expect(body.reason).toContain("content invalid");

    done();
  });

  it("Gets a page of emails", async (done) => {
    const input: Email[] = [];
    const dg = new DataGenerator();
    for (let i = 0; i < 26; i++) {
      input.push(dg.getEmail(i));
    }
    await container.db.insert(input);

    const result = await request(mailer.app).get("/emails?page=1&perPage=5")
      .expect(200);

    const body = result.body;

    expect(body.currentPage).toBe(1);
    expect(body.lastPage).toBe(5);
    expect(body.perPage).toBe(5);
    expect(body.emails.length).toBe(5);

    expect(typeof body.emails[0].created).toBe("number");

    done();
  });
});

