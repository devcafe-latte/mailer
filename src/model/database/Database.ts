import { readFileSync } from 'fs';
import { QueryOptions } from 'mysql';
import { Connection, createConnection, createPool, Pool } from 'promise-mysql';

import container from '../DiContainer';
import { selectType, toObject, timeout } from '../helpers';
import { MailerError } from '../MailerError';
import { DbModel, UpdateArgs } from './DbModel';
import { SqlResult } from './SqlResults';

export class Database {
  private _pool: Pool;
  private _ready: Promise<void>;
  private _model: DbModel;

  constructor() { }

  public async ready() {
    if (!this._ready) this._ready = this.init();
    return this._ready;
  }

  private async init() {
    //Setup DB Connection
    let connected = await this.createPool();

    //Try to create the db?
    if (!connected && process.env.SEED_DB) {
      console.log("Seeding Database");
      await this.trySeed();
      connected = await this.createPool();
    }

    if (!connected) {
      console.error(`Can't connect to database. Tried connecting to '${container.settings.dbHost}' with user '${container.settings.dbUser}'\n\n`);
      throw "Can't connect to database";
    }
  }

  private async createPool(attempt = 1): Promise<boolean> {
    const config = {
      host: container.settings.dbHost,
      user: container.settings.dbUser,
      password: container.settings.dbPass,
      database: container.settings.dbName,
      port: container.settings.dbPort,
      typeCast: (field, next) => {
        if (field.type === 'TINY') {
          //Convert tiny ints to bools.
          return (field.string() === '1');
        } else {
          return next();
        }
      }
    }

    try {
      this._pool = await createPool(config);
      if (!this._pool) return false;

      this._model = new DbModel(container.settings.dbName);
      await this._model.loadModel(this._pool);
      return true;
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        if (attempt > 4) return false;

        console.log("Waiting for DB server to come oneline... Attempt " + attempt);
        await timeout(500);
        return this.createPool(++attempt);
      }

      console.warn("Can't create pool: ", err.message);
      return false;
    }

  }

  private async trySeed() {
    let connection: Connection;

    //Manually create a connection without DB name and try to create the database.
    const config = {
      host: container.settings.dbHost,
      user: container.settings.dbUser,
      password: container.settings.dbPass,
      port: container.settings.dbPort,
      multipleStatements: true
    }
    console.log("Seeding Database...");
    connection = await createConnection(config);
    
    console.log("Seed connection made. Creating Database...")

    //Create if not exists
    const dbName = container.settings.dbName;
    await connection.query("CREATE DATABASE IF NOT EXISTS ?? /*!40100 DEFAULT CHARACTER SET utf8 */; USE ??;", [dbName, dbName]);

    const tableRows = await connection.query("SHOW TABLES");
    if (tableRows.length > 1) return;
    await connection.query(readFileSync(__dirname + "/../../seed.sql").toString());
    await connection.end();
  }

  async ping() {
    if (!this._pool) throw "Not connected";
    const c = await this._pool.getConnection();
    await c.release();
  }

  async activeConnections(): Promise<number> {
    const result: any = await container.db.getRow("show status where variable_name = 'threads_connected';");
    return Number(result.Value);
  }

  async delete(table: string, id: string | string[] | number | number[], column = 'id') {
    if (id === undefined || id === null) throw MailerError.new("Delete statements need some IDs for the WHERE clause");

    const ids = Array.isArray(id) ? id : [id];
    if (ids.length === 0) throw MailerError.new("Delete statements need some IDs for the WHERE clause");

    const sql = "DELETE FROM ?? WHERE ?? in (?)";
    const values = [table, column, ids];

    try {
      const result = await this._pool.query(sql, values);
      return result.affectedRows;
    } catch (err) {
      console.error("DELETE failed", err);
      console.info(sql, values);
      throw err;
    }
  }

  async update(args: UpdateArgs) {
    const qry = this._model.getUpdate(args);

    const hasWhereClause = Boolean(qry.sql.match(/(\sWHERE\s)/));
    if (!hasWhereClause) throw MailerError.new("Updates need a WHERE clause!");

    const result = await this._pool.query(qry);
    return result.affectedRows;
  }

  async __update(object: any, idColumn: string): Promise<number>;
  async __update(tableName: string, object: any, idColumn: string): Promise<number>;
  async __update(tableNameOrObject: any, objectOrColumn: any, column?: string): Promise<number> {
    const qry = this._model.createUpdate(tableNameOrObject, objectOrColumn, column);
    const result = await this._pool.query(qry);

    return result.affectedRows;
  }

  async insert(objects: Object[]): Promise<void>;
  async insert(object: Object): Promise<void>;
  async insert(table: string, object: Object): Promise<void>;
  async insert(table: string, objects: Object[]): Promise<void>;
  async insert(tableOrObjects: any, object?: any): Promise<void> {
    const qry = this._model.createInsert(tableOrObjects, object);
    const result = await this._pool.query(qry);

    //Set Insert Ids.
    const o = selectType("object", object, tableOrObjects);
    const a = selectType("array", object, tableOrObjects);

    if (!result.insertId) return;

    if (o) {
      //If the input was an object, and that object has an ID, set that ID.
      if (o.id !== undefined) {
        o.id = result.insertId;
      }
    } else if (a) {
      //If the input was an array, go through the items, and set the id.
      //Note that insertId will be the id of the FIRST inserted row. 
      let insertId = result.insertId;
      for (let item of a) {
        if (item.id !== undefined) item.id = insertId;
        insertId++;
      }
    }
  }

  async getValue(sql: string, values?: any): Promise<any> {
    const results = await this.getValues(sql, values);
    return results[0] || null;
  }

  async getValues(sql: string, values?: any): Promise<any[]> {
    const rows: any[] = await this.getRows(sql, values);
    if (rows.length === 0) return [];

    //Get the first column
    let key: string;
    for (let k in rows[0]) {
      if (rows[0].hasOwnProperty(k)) {
        key = k;
        break;
      }
    }

    const results = [];
    for (let r of rows) {
      results.push(r[key]);
    }
    return results;
  }

  async getRow<T>(sql: string, values?: any, type?: Type<T>): Promise<T> {
    const rows = await this.getRows(sql, values, type);
    return rows[0] || null;
  }

  async getRows<T>(sql: string, values?: any, type?: Type<T>): Promise<T[]> {
    let rows: any[];
    try {
      rows = await this._pool.query(sql, values);
    } catch (err) {
      console.error("getRows error:", err);
      console.info(sql, values);
      throw err;
    }

    const results: T[] = [];

    for (let r of rows) {
      if (type && typeof type.deserialize === "function") {
        results.push(type.deserialize(r));
      } else if (type) {
        results.push(toObject(type, r));
      } else {
        results.push({ ...r });
      }
    }
    return results;
  }

  async getObjects(qry: QueryOptions, mapping?: TypeMapping): Promise<SqlResult> {
    qry.nestTables = true;
    const r = SqlResult.new(await this._pool.query(qry));

    if (!r.hasResults) return r;

    if (!mapping) mapping = {};
    for (let alias in mapping) {
      if (!mapping.hasOwnProperty(alias)) continue;
      r.cast(alias, mapping[alias]);
    }

    return r;
  }

  async query(options: QueryOptions): Promise<any>;
  async query(sql: string, values?: any): Promise<any>;
  async query(sql: any, values?: any): Promise<any> {
    return this._pool.query(sql, values);
  }

  async shutdown() {
    return this._pool.end();
  }

}

export interface Type<T> extends Function {
  new(...args: any[]): T;
  deserialize?: Function
}

export interface TypeMapping {
  [alias: string]: any;
}