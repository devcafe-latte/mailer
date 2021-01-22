import bodyParser from 'body-parser';
import express = require('express');

import container from '../DiContainer';
import { cleanForSending } from '../helpers';
import { requiredBody } from '../middlewares';
import { Transport } from '../Transport';
import request from 'supertest';
import moment from 'moment';
import { Serializer } from '../Serializer';

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
  const response: any = {
    express: "ok",
    database: "ok",
    status: "ok"
  };

  try {
    await container.db.ping();
  } catch (error) {
    console.error(error);
    response.database = "not ok";
    response.status = "not ok";
    res.status(500);

    if (container.debug) {
      response.error = error;
    }
  }

  res.send(response);
});

router.post('/email', requiredBody('to', 'subject', 'text'), async (req, res, next) => {
  try {
    console.log("Sending email: " + req.body.subject);
    const result = await container.mailer.sendMail(req.body);

    if (result.success) {
      res.send({
        result: "ok",
        message: "Message sent"
      });
    } else {
      res.send({
        result: "ok with errors",
        message: "Message queued, but not sent.",
        error: result.error
      });
    }
  } catch (err) {
    console.log("Sending email failed.");
    next(err);
  }
  
});

router.post('/email-from-template', requiredBody('to', 'template'), async (req, res, next) => {
  try {
    console.log("Sending email from Template: " + req.body.template);
    const result = await container.mailer.sendMailFromTemplate(req.body);

    if (result.success) {
      res.send({
        result: "ok",
        message: "Message sent"
      });
    } else {
      res.send({
        result: "ok with errors",
        message: "Message queued, but not sent.",
        error: result.error
      });
    }
  } catch (err) {
    console.log("Sending email failed.");
    next(err);
  }
  
});

router.get('/emails', async (req, res, next) => {
  const page = req.query.page ? Number(req.query.page) : 0;
  const perPage = req.query.perPage ? Number(req.query.perPage) : 25;

  try {
    const result = await container.mailer.getEmails(page, perPage);
    cleanForSending(result.emails);
    res.send(result);
  } catch (err) {
    next(err);
  }
});

/* region Templates */
router.get('/templates', async (req, res, next) => {
  try {
    const result = await container.mailer.getTemplates();
    cleanForSending(result);
    res.send({ status: 'ok', templates: result });
  } catch (err) {
    next(err);
  }
});

router.post('/templates', requiredBody('name', 'text', 'subject'), async (req, res, next) => {
  try {
    const template = await container.mailer.saveTemplate(req.body);
    cleanForSending(template);
    res.send({ status: 'ok', template });
  } catch (err) {
    next(err);
  }
});

router.put('/templates', requiredBody('name'), async (req, res, next) => {
  try {
    const template = await container.mailer.updateTemplate(req.body);
    cleanForSending(template);
    res.send({ status: 'ok', template });
  } catch (err) {
    next(err);
  }
});

router.delete('/templates/:name/:language', async (req, res, next) => {
  try {
    const template = await container.mailer.removeTemplate(req.params.name, req.params.language);
    cleanForSending(template);
    res.send({ status: 'ok', template });
  } catch (err) {
    next(err);
  }
});
/* End region */

/* Region Transports */
router.get('/transports', async (req, res, next) => {
  try {
    const result = await container.tm.get(false);
    cleanForSending(result);
    res.send({ status: 'ok', transports: result });
  } catch (err) {
    next(err);
  }
});

router.get('/transport-stats', async (req, res, next) => {
  try {
    const start = req.query.start ? moment.unix(req.query.start) : null;
    const end = req.query.end ? moment.unix(req.query.end) : null;
    
    const stats = await container.tm.getStats(start, end);

    res.send({ status: 'ok', stats: Serializer.serialize(stats) });
  } catch (err) {
    next(err);
  }
});

router.post('/transports', requiredBody('name', 'type'), async (req, res, next) => {
  try {
    const transport = Transport.deserialize(req.body);
    if (transport.active === undefined || transport.active === null) transport.active = true;
    transport.default = Boolean(transport.default);
    transport.weight = Number(transport.weight);

    await container.tm.add(transport);
    cleanForSending(transport);
    res.send({ status: 'ok', transport });
  } catch (err) {
    next(err);
  }
});

router.put('/transports', requiredBody('id'), async (req, res, next) => {
  try {
    const transport = await container.tm.getById(req.body.id);
    transport.patch(req.body);
    await container.tm.update(transport);
    cleanForSending(transport)
    res.send({ status: 'ok', transport });
  } catch (err) {
    next(err);
  }
});

router.delete('/transports/:id', async (req, res, next) => {
  try {
    await container.tm.delete(Number(req.params.id));
    res.send({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});
/* End region */

//404 Handler
router.use((req, res) => {
  res.status(404);
  const error = {
    message: "Not found: " + req.method + " " + req.path,
    status: 404
  };
  throw error;
})


//Error handling
router.use((err, req, res, next) => {
  res.status(err.status || 500);

  let error: string;
  if (typeof err === "string") error = err;

  const data = {
    status: "failed",
    path: req.path,
    reason: error || err.message || err.code || "Unknown Error",
    error: undefined
  }

  if (process.env.NODE_ENV !== "production") {
    data.error = err;
  }

  res.send(data);
});

export { router as RouteConfig }