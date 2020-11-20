import { Settings } from '../model/Settings';

describe('Settings Test', () => {
  it('tries integers', () => {
    process.env.PORT = "5555";
    const s = new Settings();
    expect(s.port).toBe(5555);
  });

  it('tries default integers', () => {
    //This used to fail, but pretty sure it doesn't anymore. Fixed: 8/11/2019
    process.env.PORT = "3001";
    const s = new Settings();
    expect(s.port).toBe(3001);
  });


  it('tries booleans', () => {
    delete process.env.SMTP_SECURE;
    let s = new Settings();
    expect(s.smtpSecure).toBe(true, "Should default to true");

    process.env.SMTP_SECURE = "1";
    s = new Settings();
    expect(s.smtpSecure).toBe(true, "Should be true");

    process.env.SMTP_SECURE = "true";
    s = new Settings();
    expect(s.smtpSecure).toBe(true, "Should be true");

    process.env.SMTP_SECURE = "0";
    s = new Settings();
    expect(s.smtpSecure).toBe(false, "Should be false");

    process.env.SMTP_SECURE = "false";
    s = new Settings();
    expect(s.smtpSecure).toBe(false, "Should be false");

    process.env.SMTP_SECURE = "anythingelse";
    s = new Settings();
    expect(s.smtpSecure).toBe(false, "Should be false");
  });



});