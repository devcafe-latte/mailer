import dotenv from 'dotenv';
import { existsSync } from 'fs';

import { Database } from './database/Database';
import { MailManager } from './mail/MailManager';
import { Settings } from './Settings';

export class Container {
  private _ready: Promise<void>;

  settings: Settings;
  db: Database;
  mailer: MailManager;

  get debug(): boolean { return this.settings.debug; }

  constructor() { }

  public async ready() {
    if (!this._ready) this._ready = this.init();
    return this._ready;
  }

  public async restart() {
    return await this.init();
  }

  private async init() {
    //Load dotenv file if any.
    if (existsSync('.env')) dotenv.config();

    this.settings = new Settings();
    this.mailer = new MailManager();
    this.db = new Database();

    await this.db.ready();
  }

  async shutdown() {
    return Promise.all([
      this.db.shutdown(),
    ])
      .catch(() => {
        console.error("Shutdown didn't happen gracefully...");
      });
  }
}

const container = new Container();
export default container;