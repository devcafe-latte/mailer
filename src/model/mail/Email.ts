import moment, { Moment } from 'moment';

import { isValidEmail, toObject } from '../helpers';
import { DefaultMailSettings } from '../Settings';

import _ from 'lodash';

export interface EmailContent {
  from?: string | Address;
  to: string | Address;
  replyTo?: string | Address;
  subject: string;
  text: string;
  html?: string;

  //For template
  language?: string;
  template?: string;
  params?: any;
}

export interface MailTemplate {
  id?: number;
  name: string;
  language?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Address {
  name?: string;
  address: string;
}

export const MailStatus = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
}

export class Email implements EmailContent {
  id: number = null;

  from: string = null;
  to: string = null;
  replyTo?: string = null;
  subject: string = null;
  text: string = null;
  html?: string = null;

  maxRetries: number = null;
  attempt: number = null;
  status: string = null;
  error?: string = null;
  sent?: Moment = null;
  created: Moment = null;
  retryAfter?: Moment = null;
  template?: string = null;
  language?: string = null;

  transportId?: number = null;

  isValid(errors = []): boolean {
    if (!this.isValidAddress(this.from)) errors.push("'from' is not a valid address string");
    if (!this.isValidAddress(this.to)) errors.push("'to' is not a valid address string");
    if (!this.subject) errors.push("'subject' is missing");
    if (!this.text) errors.push("'text' is missing");

    if (this.maxRetries === undefined || this.maxRetries === null) errors.push("'maxRetries' missing");
    if (!this.status) errors.push("'status' missing");
    if (this.attempt === undefined || this.attempt === null) errors.push("'attempt' missing");
    if (!this.created) errors.push("'created' missing")

    return errors.length === 0;
  }

  toNodeMailerMail() {
    const clone = _.clone(this);
    delete clone.template;
    delete clone.language;
    return clone;
  }

  private isValidAddress(address: string): boolean {
    /* Valid formats:
    1: name@example.com
    2: name with possible spaces <name@example.com>
    */

    // It should not be empty.
    if (!address || address.length === 0) return false;

    //Format 1
    if (isValidEmail(address)) return true;

    //Format 2
    const parts = address.split(" <");
    if (parts.length !== 2) return false;

    const email = parts[1].substring(0, parts[1].length -1);
    return isValidEmail(email);
  }

  static fromMailContent(mc: EmailContent, defaults: DefaultMailSettings) {
    const m = new Email();
    if (!mc.from) mc.from = defaults.from;
    if (mc.template && !mc.language) mc.language =  defaults.language;

    Object.assign(m, mc);
    if (typeof mc.from === "object") m.from = Email.addressToString(mc.from);
    if (typeof mc.to === "object") m.to = Email.addressToString(mc.to);
    if (typeof mc.replyTo === "object") m.replyTo = Email.addressToString(mc.replyTo);
    m.created = moment();
    m.status = MailStatus.PENDING;
    m.maxRetries = 10;
    m.attempt = 0;

    return m;
  }

  static addressToString(a: Address): string {
    if (!a.name) return a.address;

    return `${a.name} <${a.address}>`;
  }

  static deserialize(data: any): Email {
    let m = toObject<Email>(Email, data);

    if (data.created) m.created = moment.unix(data.created);
    if (data.retryAfter) m.retryAfter = moment.unix(data.retryAfter);
    if (data.sent) m.sent = moment.unix(data.sent);

    return m;
  }

  serialize() {
    const o: any = { ...this };

    if (this.created) o.created = this.created.unix();
    if (this.retryAfter) o.retryAfter = this.retryAfter.unix();
    if (this.sent) o.sent = this.sent.unix();

    return o;
  }
}