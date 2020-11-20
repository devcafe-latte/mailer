import { Email, MailStatus } from './mail/Email';
import { PseudoRandomizer } from './PseudoRandomizer';

export class DataGenerator {
  //Test Data Generator

  private _rand = new PseudoRandomizer();

  constructor() { }

  getEmail(seed = 1) {
    this._rand.seed(seed);
    

    const m = new Email();
    const fromHash = this._rand.md5();
    m.from = `User ${fromHash} <from-${fromHash}@covle.com>`;

    const toHash = this._rand.md5();
    m.to = `User ${toHash} <to-${toHash}@covle.com>`;

    m.subject = "Just a subject";
    m.text = this._rand.text();
    m.html = "<h1>header</h1><p>" + m.text + "</p>";
    m.created = this._rand.date();
    m.status = MailStatus.PENDING;
    m.attempt = 0;
    m.maxRetries = 10;

    return m;

  }
  // getSample(seed = 1): Sample {
  //   this._rand.seed(seed);

  //   const s = new Sample();

  //   s.created = this._rand.date();
  //   s.mode = (this._rand.number(10) < 3) ? 'DEVICE CONTROL' : 'SAMPLE';
  //   s.deviceBatchId = this._rand.number(1, 100);
  //   s.deviceSampleId = this._rand.number(1, 100);
  //   s.userBatchId = null;
  //   s.userSampleId = null;
  //   s.result = this._rand.number(100, 10000) / 100;
  //   s.unit = "kelvin";
  //   s.comment = null;
  //   s.discarded = false;
  //   s.importId = 1;
  //   s.calcHash();

  //   return s;
  // }


}