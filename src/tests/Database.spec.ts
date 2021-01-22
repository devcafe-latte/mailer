import { createConnection } from 'promise-mysql';

import container from '../model/DiContainer';
import { TestHelper } from './TestHelper';
import { Settings } from '../model/Settings';

const dbName = "mailer_for_seed_test";

describe('Seed initial database', () => {

  beforeEach(async (done) => {
    process.env.DB_NAME = dbName;
    TestHelper.setTestEnv();
    await dropDatabase();
    done();
  });

  afterEach(async (done) => {
    delete process.env.DB_NAME;
    done();
  });

  it("Does not seed", async (done) => {
    delete process.env.SEED_DB;

    try {
      await container.restart();
      //some error?
      await container.db.ping();
      throw "We shouldn't get here.";
    } catch (err) {
      expect(err).toContain("Can't connect");
    }

    done();
  });

  it("Tries to seed", async (done) => {
    process.env.SEED_DB = "1";
    await container.restart();
    await container.db.ping();

    done();
  });

});

describe('Try the database', () => {

  let th: TestHelper;

  beforeEach(async (done) => {
    th = await TestHelper.new();  
    done();
  });

  afterEach(async (done) => {
    await th.shutdown();
    done();
  });

  it("ping database", async (done) => {
    await container.db.ping();
    done();
  });

});

async function dropDatabase() {
  const settings = new Settings();
  const config = {
    host: settings.dbHost,
    user: settings.dbUser,
    password: settings.dbPass,
    port: settings.dbPort,
    multipleStatements: true
  }
  try {
    const connection = await createConnection(config);
    await connection.query("DROP DATABASE IF EXISTS ??;", [dbName]);
    connection.end();
  } catch (err) {
    console.log("Couldn't drop db to prepare");
  }
}