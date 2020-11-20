import { EmailContent, Email } from '../model/mail/Email';
describe('Email Tests', () => {
  const validContent1: EmailContent = {
    to: "Co van Leeuwen <coo@covle.com>",
    from: { name: "Peter", address: "blup@bluppie.com" },
    subject: "A test subject",
    text: "How now brown cow?"
  };

  const validContent2: EmailContent = {
    to: "coo@covle.com",
    from: { address: "blup@bluppie.com" },
    subject: "A test subject 2",
    text: "Well yes. But also no.",
    html: "<strong>well yes</strong>. But also <i>no</i>."
  };

  it ("tests fromContent", () => {
    const m = Email.fromMailContent(validContent1);
    expect(m.isValid()).toBe(true);

    const m2 = Email.fromMailContent(validContent2);
    expect(m2.isValid()).toBe(true);
  });

  it ("tests validity", () => {
    const m = new Email();
    let errors = [];
    expect(m.isValid(errors)).toBe(false);
    expect(errors.length).toBe(8);

    errors = [];
    m.from = "blup@blat.nl";
    expect(m.isValid(errors)).toBe(false);
    expect(errors.length).toBe(7);
  });

  it ("tests valid address strings", () => {
    const m = Email.fromMailContent(validContent1);
    expect(m.isValid()).toBe(true);

    m.from = "Not an email address";
    expect(m.isValid()).toBe(false);

    m.from = "missing trailing space<coo@covle.com>";
    expect(m.isValid()).toBe(false);

    m.from = "<coo@covle.com>";
    expect(m.isValid()).toBe(false);

    m.from = "Bla die bla <coo@covle.com>";
    expect(m.isValid()).toBe(true);

    m.from = "coo@covle.com";
    expect(m.isValid()).toBe(true);


  });



});