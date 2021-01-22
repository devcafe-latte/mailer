import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { createConnection } from 'promise-mysql';

import container from '../model/DiContainer';
import { convertSettingsToTransports } from '../model/helpers';
import { Settings, MailTransportType } from '../model/Settings';

export class TestHelper {
  private _jasmineTimeout;
  constructor() { }

  public static setTestEnv() {
    //Set some test settings (these don't overwrite. So if they are already set, that's good too)
    dotenv.config({ "path": __dirname + '/resources/test.env' });
    if (existsSync(__dirname + '/resources/secrets.env')) {
      dotenv.config({ "path": __dirname + '/resources/secrets.env' });
    }
  }

  private async init() {
    TestHelper.setTestEnv();
    const settings = new Settings();

    this._jasmineTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 1000;

    if (!settings.dbName.endsWith('_test')) {
      throw new Error(`Database ${settings.dbName} doesn't look like a test database to me! Should end in '_test'`);
    }

    //Reset the database
    const connection = await createConnection({
      host: settings.dbHost,
      user: settings.dbUser,
      password: settings.dbPass,
      port: settings.dbPort,
      multipleStatements: true
    });
    await connection.query(readFileSync(__dirname + "/resources/fixture.sql").toString());

    //Migrate DB
    execSync("npx db-migrate up");

    //Make the container happen
    await container.restart();

    //Kill this temporary connection.
    await connection.end();
  }

  async setAsOnlyMailer(type: MailTransportType) {
    await container.db.query("DELETE FROM transport");
    await convertSettingsToTransports();
    const transports = await container.tm.get();
    const found = transports.find(t => t.type === type);
    if (!found) throw "Can't find transport of type " + type;

    found.default = true;

    await container.db.query("UPDATE `transport` SET `weight` = 0, `default` = 0");
    await container.db.query("UPDATE `transport` SET `default` = 1 WHERE `id` = ?", [found.id]);
    return found;
  }

  static async new(): Promise<TestHelper> {
    const t = new TestHelper();
    await t.init();
    return t;
  }

  async shutdown() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = this._jasmineTimeout;
    return container.shutdown();
  }
}

export class TestUser {
  email?: string;
  firstname?: string;
  uuid?: string;
}