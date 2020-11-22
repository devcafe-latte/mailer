import bodyParser from 'body-parser';
import express = require('express');

import container from '../DiContainer';
import { requiredBody } from '../middlewares';
import { cleanForSending } from '../helpers';
import { MailerError } from '../MailerError';

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

  const data = {
    status: "failed",
    path: req.path,
    reason: err.message || "Unknown Error",
    error: undefined
  }

  if (process.env.NODE_ENV !== "production") {
    data.error = err;
  }

  res.send(data);
});

export { router as RouteConfig }