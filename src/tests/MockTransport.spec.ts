import container from '../model/DiContainer';
import { EmailContent } from '../model/mail/Email';
import { MailManager } from '../model/mail/MailManager';
import { MockTransport } from '../model/MockTransport';
import { TestHelper } from './TestHelper';
import { TransportManager } from '../model/TransportManager';

describe('Basic Sending of messages', () => {

  let th: TestHelper;
  let mm: MailManager;
  let tm: TransportManager;
  const mailContent: EmailContent = {
    to: "Coo van Leeuwen <Coo@covle.com>",
    from: "Jacky D <Jack@covle.com>",
    subject: "Do you need a drink?",
    text: "Test 123",
    html: "<h5>Test 123</h5> <p>test <strong>strong</strong></p>"
  };

  beforeEach(async (done) => {
    th = await TestHelper.new();
    mm = container.mailer;
    tm = container.tm;
    
    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  
  it('gets mock transport', async () => {
    const t = await container.tm.getTransport(1);
    const mailer = t.getMailer();

    const transporter: MockTransport = mailer.transporter as MockTransport;
    expect(transporter.constructor.name).toBe("MockTransport");
  });

  it('Sends successful message with Mock', async () => {
    const result = await mm.sendMail(mailContent);
    expect(result.success).toBe(true);
  });

  it('Gets send error with Mock transport', async () => {
    const t = await tm.getTransport();
    const mailer = t.getMailer();
    const transporter: MockTransport = mailer.transporter as MockTransport;

    transporter.shouldError = true;
    
    const result = await mm.sendMail(mailContent);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Mock error");
  });

});