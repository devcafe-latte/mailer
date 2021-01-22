import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { Database } from 'cereal-bowl';

import { MailManager } from './mail/MailManager';
import { Settings } from './Settings';
import { TransportManager } from './TransportManager';

export class Container {
  private _ready: Promise<void>;

  settings: Settings;
  db: Database;
  mailer: MailManager;
  tm: TransportManager;

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
    this.db = new Database({
      database: this.settings.dbName,
      host: this.settings.dbHost,
      user: this.settings.dbUser,
      password: this.settings.dbPass,
      port: this.settings.dbPort
    });
    await this.db.ready();

    this.mailer = new MailManager();
    this.tm = new TransportManager();
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