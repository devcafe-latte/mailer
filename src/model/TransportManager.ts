import container from './DiContainer';
import { convertSettingsToTransports } from './helpers';
import { MailerError } from './MailerError';
import { MailTransportType } from './Settings';
import { Transport, MailgunSettings, TransportSettings, SendInBlueSettings, SmtpSettings } from './Transport';

export class TransportManager {

  /* 
    Transports are weighted, this allows us to send e.g. 30% of emails with transport 1, and 70% to transport 2.
    If no weights are set (or set to 0), we will fallback on the (last) one marked as default. 
    If none are marked as default, the first transport in the database will be used.
   */
  private _transports: { [key: number]: Transport } = {};
  private _weights = [];
  private _defaultTransport: Transport;

  get isLoaded(): boolean {
    return Boolean(this._defaultTransport);
  }

  async reloadTransports() {
    const transports = await this.get();
    //Convert from legacy settings
    if (transports.length === 0) return this.convert();

    this._transports = {};
    this._weights = [];
    for (let t of transports) {
      this._transports[t.id] = t;
      if (t.weight) this._weights.push(...Array(t.weight).fill(t.id));
      if (t.default) this._defaultTransport = t;
    }

    //If no default is set, just use the first one.
    if (!this._defaultTransport) this._defaultTransport = transports[0];
  }

  private async convert() {
    await convertSettingsToTransports();
    return this.reloadTransports();
  }

  async getTransport(id?: number): Promise<Transport> {
    if (!this.isLoaded) await this.reloadTransports();
    
    //If no transport, or it's a disabled one, set transport to something valid.
    if (!id || !this._transports[id]) {
      if (this._weights.length === 0) {
        //Weights not in use, return default.
        return this._defaultTransport
      } else {
        //We select a 'random' one based on the weights.
        const n = Math.floor(Math.random() * this._weights.length);
        return this._transports[this._weights[n]];
      }
    }

    //Return the selected transport
    return this._transports[id];
  }

  async add(t: Transport) {
    if (!t.isValid()) throw MailerError.new("Transport not valid: " + t.type, 400);

    t.id = null;

    await container.db.insert(t);
    if (t.type === MailTransportType.MAILGUN) {
      t.mg.transportId = t.id;
      await container.db.insert('mailgunSettings', t.mg);
    } else if (t.type === MailTransportType.SENDINBLUE) {
      t.sib.transportId = t.id;
      await container.db.insert('sendInBlueSettings', t.sib);
    } else if (t.type === MailTransportType.SMTP) {
      t.smtp.transportId = t.id;
      await container.db.insert('smtpSettings', t.smtp);
    }

    return t;
  }

  async get(activeOnly = true): Promise<Transport[]> {
    const sql = [
      "SELECT * FROM transport t",
      "LEFT JOIN mailgunSettings mg on mg.transportId = t.id",
      "LEFT JOIN smtpSettings smtp on smtp.transportId = t.id",
      "LEFT JOIN sendInBlueSettings sib on sib.transportId = t.id",
    ];

    if (activeOnly) {
      sql.push("WHERE t.active = 1");
    }

    const results = await container.db.getObjects({ sql: sql.join("\n"), values: [] }, { t: Transport });
    if (!results.hasResults) return [];

    
    for (let mg of results.get<MailgunSettings>('mg')) {
      results.get<Transport>('t', mg.transportId).mg = mg;
    }
    for (let sib of results.get<SendInBlueSettings>('sib')) {
      results.get<Transport>('t', sib.transportId).sib = sib;
    }
    for (let smtp of results.get<SmtpSettings>('smtp')) {
      results.get<Transport>('t', smtp.transportId).smtp = smtp;
    }
    
    return results.get<Transport>('t');
  }

  async update(t: Transport) {
    if (!t.id) throw MailerError.new("Can't update Transport, Missing ID", 400);
    if (!t.isValid()) throw MailerError.new("Can't update TRansport. Missing Setting for " + t.name, 400);

    await container.db.update({ object: t });
  }

  async delete(id: number) {
    await container.db.delete("transport", id);
  }
}