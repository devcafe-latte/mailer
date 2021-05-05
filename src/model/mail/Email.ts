import moment, { Moment } from 'moment';

import { isValidEmail } from '../helpers';
import { DefaultMailSettings } from '../Settings';
import addressparser from 'addressparser';

import _ from 'lodash';
import { ObjectMapping, Serializer } from '../Serializer';

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

  from: string = null; //Can be just an email address, or a string like "Peter Doink <peter@thefactory.foo>"
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
  
  /**
   * Replace the FROM domain with the domain set by the transport (if any)
   *
   * @param {string} [domain]
   * @returns
   * @memberof Email
   */
  setFromDomain(domain?: string) {
    if (!domain) return;

    const address = addressparser(this.from)[0];
    const parts = address.address.split("@");
    parts.pop();
    parts.push(domain);
    address.address = parts.join("@");

    this.from = Email.addressToString(address);
  }

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

  static stringToAddres(input: string): Address {
    //example input: Dude <dude@exmaple.com>
    const parts = input.split('<');
    if (parts.length === 1) return { address: input };

    return {
      name: parts[0].trim(),
      address: parts[1].replace(/>/, ''),
    }
  }

  static deserialize(data: any): Email {

    const m: ObjectMapping = {
      created: 'moment',
      retryAfter: 'moment',
      sent: 'moment',
    };

    return Serializer.deserialize(Email, data, m);
  }

}