import { RelationshipMapper } from './RelationshipMapper';
export class SqlResult {
  private _rows: any[] = [];
  data: any = {};

  get hasResults(): boolean { return (this._rows.length > 0); }

  cast(key: string, type) {
    if (!this.data[key]) return;// throw new Error(`Key ${key} doesn't exist.`);

    if (typeof type.deserialize !== 'function') throw new Error("No deserialize() function on type.");

    const collection = this.data[key];

    for (let id in collection) {
      if (!collection.hasOwnProperty(id)) continue;
      collection[id] = type.deserialize(collection[id]);
    }
  }


  /**
   * Get Item from result set
   * @param key Table Alias
   * @param id Id of the item to return.
   */
  get<T>(key: string, id: number): T;
  /**
   * Get Array from result set
   * @param key Table Alias
   */
  get<T>(key: string): T[];
  get<T>(key: string, id?: number) {
    if (!id) return this.array(key);

    return this.data[key][id] || null;
  }

  put(table: string): RelationshipMapper {
    return RelationshipMapper.put(table, this);
  }

  /**
   * Returns a collection as an array.
   *
   * @param {string} key name of the follection
   * @returns
   * @memberof SqlResult
   */
  private array(key: string) {
    if (!this.data[key]) return [];
    const result = [];
    const collection = this.data[key];
    for (let id in collection) {
      if (!collection.hasOwnProperty(id)) continue;
      result.push(collection[id]);
    }

    return result;
  }

  static new(rows: any[]): SqlResult {
    const s = new SqlResult();
    s._rows = rows;
    s.group();

    return s;
  }

  private group() {
    this.data = {};
    for (let r of this._rows) {
      this.processRow(r);
    }
  }

  private processRow(row: any) {
    for (let key in row) {
      if (!row.hasOwnProperty(key)) continue;

      //Create the object collection if it didn't exist
      if (!this.data[key]) {
        this.data[key] = {};
      }
      const collection = this.data[key];
      const object = row[key];

      //With outer joins, it's possible for id to be null.
      if (!object.id) continue;

      //Add this row to it if it didn't exist.
      if (!collection[object.id]) {
        collection[object.id] = object;
      }
    }

  }

}