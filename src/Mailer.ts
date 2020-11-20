import express = require('express');
import { Server } from 'http';

import container from './model/DiContainer';
import { RouteConfig } from './model/routes/routes';

class Mailer {
  private _app: express.Application = express();
  private _server: Server

  get app(): express.Application { return this._app; }

  constructor() {
    this._app.use(RouteConfig);    
  }

  async listen() {
    //warm up
    try {
      await container.ready();
    } catch (err) {
      console.error("Fatal error, couldn't start Mailer");
      console.error(err);
      process.exit(1);
    }
    

    const port = container.settings.port;
    this._server = this._app.listen(port, () => {
      console.log(`Mailer is listening on port ${port}!`);
    });
    
    this._server.on('close', async () => {
      await container.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.info("Got SIGTERM. Gracefully shutting down.");
      this._server.close();
    });
  }
}

export const mailer = new Mailer();