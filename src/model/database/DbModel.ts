import { MailerError } from '../MailerError';
import { Connection, Pool } from 'promise-mysql';
import { QueryOptions } from 'mysql';
import { selectType } from '../helpers';

export interface UpdateArgs {
  object: any,
  table?: string,
  column?: string,
  keepNulls?: boolean,
}

export class DbModel {
  tables: Table[] = [];

  constructor(public name?: string) { }

  getTable(name: string): Table {
    const table = this.tables.find(t => t.name === name);
    if (!table) throw MailerError.new(`Table ${name} not found in Database ${this.name}.`);

    return table;
  }

  getUpdate(a: UpdateArgs): QueryOptions {
    if (!a.table) a.table = this.getTableName(a.object);
    a.keepNulls = Boolean(a.keepNulls);

    const table = this.getTable(a.table);
    return table.createUpdate(a.object, a.column, a.keepNulls);
  }

  //Really I want to get rid of the 100 overloads
  createUpdate(object: any): QueryOptions;
  createUpdate(object: any, column?: string): QueryOptions;
  createUpdate(table: string, object: any): QueryOptions;
  createUpdate(table: string, object: any, column?: string): QueryOptions;
  createUpdate(tableOrObject: any, objectOrColumn?: any, column?: any): QueryOptions {
    //normalize
    const table = this.getTableName(tableOrObject);
    column = selectType("string", column, objectOrColumn);
    const object = selectType("object", objectOrColumn, tableOrObject);

    if (!object) throw MailerError.new("No object to update");

    return this.getTable(table).createUpdate(object, column);
  }

  createInsert(object: Object): QueryOptions;
  createInsert(objects: Object[]): QueryOptions;
  createInsert(table: string, object: Object): QueryOptions;
  createInsert(table: string, objects: Object[]): QueryOptions;
  createInsert(tableOrObjects: any, object?: any): QueryOptions {
    //Normalize
    const table = this.getTableName(tableOrObjects);

    if (typeof tableOrObjects !== "string") {
      object = tableOrObjects;
    }

    return this.getTable(table).createInsert(object);
  }

  private getTableName(value: any) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (value.length === 0) throw MailerError.new("I need more than 0 objects to get a Table name");
      value = value[0];
    }

    if (typeof value === "object") {
      const name = value.constructor.name.toLowerCase();
      if (name === "object") throw MailerError.new("I need a better table name than 'object'");
      return name;
    }

  }

  async loadModel(con: Connection | Pool) {
    this.tables = [];

    const tableRows = await con.query("SHOW TABLES");
    if (tableRows.length === 0) throw MailerError.new("Can't load database model.");

    //Get the first column
    let key: string;
    for (let k in tableRows[0]) {
      if (tableRows[0].hasOwnProperty(k)) {
        key = k;
        break;
      }
    }

    for (let r of tableRows) {
      const t = new Table(r[key]);
      await t.loadColumns(con);
      this.tables.push(t);
    }

  }
}

export class Table {
  columns: Column[] = [];

  constructor(public name?: string) { }

  getColumn(name: string): Column {
    return this.columns.find(c => c.name === name);
  }

  createUpdate(object: Object, keepNulls?: boolean): QueryOptions
  createUpdate(object: Object, column?: string, keepNulls?: boolean): QueryOptions;
  createUpdate(object: Object, column?: string | boolean, keepNulls = false): QueryOptions {
    let sql = "UPDATE ?? SET ?";

    if (typeof column === 'boolean') keepNulls = column;

    const data = this.convertObject(object, keepNulls);
    const values = [this.name, data];

    if (typeof column === "string") {
      if (!this.columns.find(c => c.name === column)) throw MailerError.new(`Column '${column}' doesn't exist in table '${this.name}'.`);
      if (data[column] === null || data[column] === undefined) throw MailerError.new(`Object doesn't have value for property ${column}`);

      sql += " WHERE ?? = ?";
      values.push(column, data[column]);
    }

    return { sql, values };
  }

  createInsert(object: Object[] | Object): QueryOptions {
    //Normalize
    let objects: Object[];
    if (Array.isArray(object)) {
      objects = object;
    } else {
      objects = [object];
    }

    let sql = "INSERT INTO ?? ( ?? ) VALUES ?";
    const cols = this.columns.map(c => c.name);
    let rows = [];

    for (let o of objects) {
      rows.push(this.convertObjectValuesToArray(o));
    }

    return { sql, values: [this.name, cols, rows] };
  }

  async loadColumns(con: Connection | Pool) {
    if (!this.name) throw MailerError.new("No Table name!");

    this.columns = [];
    const rows = await con.query("SHOW COLUMNS FROM ??", this.name);
    for (let r of rows) {
      this.columns.push(Column.fromDb(r));
    }
  }

  private convertObjectValuesToArray(o: any) {
    let row = [];
    for (let c of this.columns) {
      row.push(this.convertValue(o[c.name], c.name));
    }
    return row;
  }

  private convertObject(input: any, keepNulls = false): any {
    const output: any = {};
    for (let c of this.columns) {
      if (!keepNulls && (input[c.name] === undefined || input[c.name] === null)) continue;

      output[c.name] = this.convertValue(input[c.name], c.name)
    }
    return output;
  }

  private convertValue(value: any, column: string) {
    if (value === undefined || value === null) return null;

    if (typeof value === "object") {
      //It can be a Moment, 
      //  or it can be something we don't know what to do with.
      if (value.constructor.name === "Moment") return value.unix();
      throw MailerError.new(`Don't know how to convert class '${value.constructor.name}' to database value for column ${column}.`);
    }

    if (typeof value === "boolean") return Number(value);

    return value;
  }

}

export class Column {
  name: string;
  type: string;
  null: boolean;
  default: string;

  static new(name: string): Column {
    const c = new Column();
    c.name = name;
    return c;
  }

  static fromDb(data: ColumnResult): Column {
    const c = new Column();
    c.name = data.Field;
    c.default = data.Default;
    c.null = (data.Null === "YES");
    c.type = data.Type;
    return c;
  }
}

interface ColumnResult {
  Default: string;
  Extra: string;
  Field: string;
  Key: string;
  Null: string;
  Type: string;
}