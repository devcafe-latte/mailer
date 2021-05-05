import { Email, EmailContent } from '../model/mail/Email';
import { DefaultMailSettings } from '../model/Settings';

describe('Email Tests', () => {
  const defaults: DefaultMailSettings = {
    from: { address: 'noreply@example.com' },
    language: 'en',
  };
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

  it("tests fromContent", () => {
    const m = Email.fromMailContent(validContent1, defaults);
    expect(m.isValid()).toBe(true);

    const m2 = Email.fromMailContent(validContent2, defaults);
    expect(m2.isValid()).toBe(true);
  });

  it("tests setFromDomain", () => {
    //Format 1
    const m = Email.fromMailContent(validContent1, defaults);
    m.setFromDomain('foo.bar.com');
    expect(m.from).toBe("Peter <blup@foo.bar.com>");

    m.from = "knop@knuk.foo"
    m.setFromDomain('foo.bar.com');
    expect(m.from).toBe("knop@foo.bar.com");

  });

  it("tests validity", () => {
    const m = new Email();
    let errors = [];
    expect(m.isValid(errors)).toBe(false);
    expect(errors.length).toBe(8);

    errors = [];
    m.from = "blup@blat.nl";
    expect(m.isValid(errors)).toBe(false);
    expect(errors.length).toBe(7);
  });

  it("tests valid address strings", () => {
    const m = Email.fromMailContent(validContent1, defaults);
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

  it("Test String to Address", () => {

    const expectations = [
      { input: "dude <dudemeister@example.com>", output: { name: 'dude', address: 'dudemeister@example.com' } },
      { input: "dude von Trapp <dudemeister@example.com>", output: { name: 'dude von Trapp', address: 'dudemeister@example.com' } },
      { input: "dudemeister@example.com", output: { address: 'dudemeister@example.com' } },
    ];

    for (let e of expectations) {
      expect(Email.stringToAddres(e.input)).toEqual(e.output);
    }


  });
});