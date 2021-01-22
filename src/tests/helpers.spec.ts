import moment from 'moment';
import uuidv4 from 'uuid/v4';

import container from '../model/DiContainer';
import {
  cleanForSending,
  convertSettingsToTransports,
  getEnum,
  hasProperties,
  isValidEmail,
  selectType,
  serializeObject,
  stripComplexTypes,
} from '../model/helpers';
import { MailTransportType } from '../model/Settings';
import { TestHelper } from './TestHelper';

describe('Helpers', function() {

  it("Tests hasProperties", () => {
    const props = ["name", "email"];
    const o1 = { name: "Patrick", email: "mrfancypants@bikinibottom.com", score: 100 };
    const o2 = { name: null, email: "mrfancypants@bikinibottom.com" };
    const o3 = { name: "Patrick" };

    expect(hasProperties(o1, props)).toBe(true);
    expect(hasProperties(o2, props)).toBe(false);
    expect(hasProperties(o3, props)).toBe(false);
  });

  it("tests transform Moments", () => {
    const input: any = {
      foo: "bar",
      baz: { id: 14 },
      date: moment()
    };

    const expected = {
      foo: "bar",
      baz: { id: 14 },
      date: input.date.unix()
    };

    cleanForSending(input);
    
    expect(expected).toEqual(input);
  });

  it("tests transform Id", () => {
    let input: any = { id: 3, uuid: uuidv4() };

    cleanForSending(input);
    
    expect(input.uuid).toBeDefined("uuid gets to stay.");
  });

  it("tests transform Id 2", () => {
    let input: any = { id: 3, some: "value" };

    cleanForSending(input);
    
    expect(input.id).toBeDefined("No uuid, so id should stay.");
  });

  it("tests transform deep", () => {
    let input: any = { name: "peter", uuid: uuidv4(), a: { b: { c: { id: 1, uuid: uuidv4(), created: moment() } } } };

    cleanForSending(input);
    
    expect(input.uuid).toBeDefined("uuid gets to stay.");
    expect(input.a.b.c.uuid).toBeDefined("uuid gets to stay.");
    expect(isNaN(input.a.b.c.created)).toBe(false, "Should be a number now.");
  });

  it("tests transform nulls", () => {
    let input: any = { id: 3, some: null };

    cleanForSending(input);
    
    expect(input.some).toBe(null);
  });

  it('Tests stripComplexTypes', () => {
    const foo = {
      id: 1,
      someArray: [1, 2 ,3],
      someObject:{ bar: "baz" },
      name: "a string",
      nothing: null
    };

    const stripped = stripComplexTypes(foo);
    expect(stripped.id).toBe(1);
    expect(stripped.name).toBe("a string");
    expect(stripped.someArray).toBeUndefined();
    expect(stripped.someObject).toBeUndefined();
    expect(stripped.nothing).toBeUndefined();

    const keepNulls = stripComplexTypes(foo, true);
    expect(keepNulls.nothing).toBe(null);
  }); 

  it("Tests email validation", () => {
    const valid = ["bla@bla.com", "stuff@dudes.what.subdomain.whateverman.net", "snakes@onaplane.org"];
    const invalid = ["Birdperson", "rick@morty", "1234"];

    for (let v of valid) {
      expect(isValidEmail(v)).toBe(true);
    }

    for (let v of invalid) {
      expect(isValidEmail(v)).toBe(false);
    }
    
  });

  it("test selectType", () => {
    expect(selectType("string", 3, true, "bluh", [1, 2, 3], { foo: "bar" })).toBe("bluh");
    expect(selectType("number", 3, true, "bluh", [1, 2, 3], { foo: "bar" })).toBe(3);
    expect(selectType("boolean", 3, true, "bluh", [1, 2, 3], { foo: "bar" })).toBe(true);
    expect(selectType("boolean", 3, false, "bluh", [1, 2, 3], { foo: "bar" })).toBe(false);
    expect(selectType("object", 3, true, "bluh", [1, 2, 3], { foo: "bar" })).toEqual( { foo: 'bar' } );
    expect(selectType("array", 3, true, "bluh", [1, 2, 3], { foo: "bar" })).toEqual([1, 2, 3]);
    expect(selectType("number", true, "bluh", [1, 2, 3], { foo: "bar" })).toBeUndefined();
  });
});

describe('serializeObject', () => {
  it("takes a simple value", () => {
    expect(serializeObject(1)).toBe(1);
    expect(serializeObject("foo")).toBe("foo");
    expect(serializeObject(false)).toBe(false);
  });

  it("takes a simple array", () => {
    const array = [1, "foo", false]
    const result = serializeObject(array);
    expect(result).toEqual(array);
  });

  it("takes a simple Object", () => {
    const obj = { num: 1, str: "foo", bool: false };
    const result = serializeObject(obj);
    expect(result).toEqual(obj);
  });

  it("takes a complex Object", () => {
    const input = { 
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized'} } }
    };

    const expected = { 
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
    };

    const result = serializeObject(input);
    expect(result).toEqual(expected);
  });

  it("takes an array with a complex Object", () => {
    const input = { 
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized'} } }
    };

    const expected = { 
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
    };

    const result = serializeObject([input]);
    expect(result).toEqual([expected]);
  });
});

describe("Transport Conversion", () => {
  let th: TestHelper;

  beforeEach(async () => {
    th = await TestHelper.new();
  });

  afterEach(async () => {
    await th.shutdown();
  });

  it("Convert Settings To Transports", async () => {
    const preCount = await container.db.getValue("SELECT COUNT(id) FROM transport");
    await convertSettingsToTransports();
    const postCount = await container.db.getValue("SELECT COUNT(id) FROM transport");

    expect(preCount).toBeLessThan(postCount);
  });

  it("getEnum", () => {
    let value: string;
    value = getEnum(MailTransportType, 'foo', MailTransportType.MAILGUN);
    expect(value).toBe(MailTransportType.MAILGUN, "Input value was invalid, so default is used.");

    value = getEnum(MailTransportType, MailTransportType.SENDINBLUE, MailTransportType.MAILGUN);
    expect(value).toBe(MailTransportType.SENDINBLUE, "Input value was good");

    value = getEnum(MailTransportType, 'sendinblue', 'mailgun');
    expect(value).toBe(MailTransportType.SENDINBLUE, "Input value was good, as string");

    try {
      value = getEnum(MailTransportType, 'sendinblue', 'foo');
      throw "shouldn't get here.";
    } catch (err) {
      expect(err.message).toContain("Not a valid default value");
    }
  });
});