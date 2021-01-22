import container from './DiContainer';
import { MailTransportType, DefaultMailSettings } from './Settings';
import { MailgunSettings, SendInBlueSettings, Transport, SmtpSettings } from './Transport';
import { MailerError } from './MailerError';

export function isValidEmail(email: string) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}

export function toObject<T>(type: { new(): T }, data: any): T {
  const o = new type();
  for (let key in o) {
    if (!o.hasOwnProperty(key)) continue;

    if (data[key] !== undefined) o[key] = data[key];
  }
  return o;
}

export function hasProperties(object: any, properties: string[], checkAsString = false): boolean {
  if (object === null || typeof object !== "object") return false;

  for (let p of properties) {
    if (object[p] === undefined || object[p] === null) return false;

    if (checkAsString) {
      if (object[p] === "undefined" || object[p] === "null") return false;
    }
  }

  return true;
}

export function hasProperty(object: any, property: string): boolean {
  return hasProperties(object, [property])
}

export function cleanForSending(body: any, depth = 1) {
  if (depth > 5) return;

  if (typeof body !== "object" || body === null) return;

  for (let key in body) {
    if (!body.hasOwnProperty(key)) continue;
    //Convert Moment objects to unix timestamp
    if (typeof body[key] === "object" && body[key] !== null && body[key].constructor.name === 'Moment') {
      body[key] = body[key].unix();
    } else if (typeof body[key] === "object" && body[key] !== null) {
      cleanForSending(body[key], depth + 1);
    }
  }
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function stripComplexTypes(object: any, keepNulls = false) {
  let clone = { ...object };

  for (let key in clone) {
    if (!clone.hasOwnProperty(key)) continue;

    if (!keepNulls && (clone[key] === null || clone[key] === undefined)) {
      delete clone[key];
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      delete clone[key];
    }
  }
  return clone;
}

//Use to unmess overloads.
export function selectType(type: string, ...args: any) {
  for (let a of args) {
    if (Array.isArray(a)) {
      if (type === "array") return a;
    } else if (typeof a === type) {
      return a;
    }

  }
  return undefined;
}

export function serializeObject(input: any, maxDepth = 10, currentDepth = 0) {
  if (currentDepth > maxDepth) return input;

  //Traverse input 
  // Array? recursive call
  // Moment? call unix()
  // serialize? call serialize()
  // object? recursive call

  let result: any;
  if (Array.isArray(input)) {
    result = [];
    for (let i of input) {
      result.push(serializeObject(i, maxDepth, currentDepth + 1));
    }
    return result;
  } else if (typeof input === "object") {
    const className = input.constructor.name;

    if (className === 'Moment') return input.unix();
    if (typeof input.serialize === "function") return input.serialize();

    result = {};
    for (let k in input) {
      if (!input.hasOwnProperty(k)) continue;
      result[k] = serializeObject(input[k], maxDepth, currentDepth + 1);
    }
    return result;
  } else {
    return input;
  }
}

export function getBoolValue(value: string, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  if (value === "1") return true;
  if (value === "true") return true;

  return false;
}

export function getEnum(enumType: any, input: string, defaultValue: string) {
  const values = Object.values(enumType);
  if (!values.includes(defaultValue)) throw MailerError.new(`Not a valid default value for enum: ${defaultValue}`);

  if (values.includes(input)) {
    return input;
  } else {
    return defaultValue;
  }
}

export async function convertSettingsToTransports() {

  //Mailgun
  if (container.settings.mailgun.apiKey !== 'notakey') {
    const t = new Transport();
    t.active = true;
    t.default = container.settings.mailTransport === MailTransportType.MAILGUN;
    t.name = "Mailgun from Settings";
    t.type = MailTransportType.MAILGUN;

    t.mg = container.settings.mailgun
    if (t.isValid()) await container.tm.add(t);
  }

  //SendInBlue
  if (container.settings.sendInBlue.apiKey !== 'notakey') {
    const t = new Transport();
    t.active = true;
    t.default = container.settings.mailTransport === MailTransportType.SENDINBLUE;
    t.name = "SendInBlue from Settings";
    t.type = MailTransportType.SENDINBLUE;

    t.sib = container.settings.sendInBlue;
    if (t.isValid()) await container.tm.add(t);
  }

  //SMTP
  if (container.settings.smtp.server !== 'notset') {
    const t = new Transport();
    t.active = true;
    t.default = container.settings.mailTransport === MailTransportType.SMTP;
    t.name = "SMTP from Settings";
    t.type = MailTransportType.SMTP;

    t.smtp = container.settings.smtp;
    if (t.isValid()) await container.tm.add(t);
  }

  //MOCK
  const mock = new Transport();
  mock.active = true;
  mock.default = container.settings.mailTransport === MailTransportType.MOCK;
  mock.name = "Mock Transport (Doesn't send mails)";
  mock.type = MailTransportType.MOCK;
  await container.db.insert(mock);

}