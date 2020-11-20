# Generic Mailer Service

Will try to email recipients, retry failed emails.

The docker container can be run as an express server or as a cron job.

The express server listens for incoming emails. This is the default command when running the container.

The cron job will process the mail queue and exit afterwards. Can be run by the command `node /app/build/cron.js`. 

## Settings

- PORT: Port number to listen on. Default: 3010
- DB_HOST - Mysql server host
- DB_USER - Mysql server user
- DB_PASS - Mysql server password
- DB_PORT - Mysql server port
- DB_NAME - Mysql Database name
- MAIL_TRANSPORT - How to send emails. Can be: smtp, mailgun, sendinblue or mock
- SMTP_HOST - SMTP server name
- SMTP_USER - SMTP server user
- SMTP_PASS - SMTP server password
- SMTP_PORT - SMTP server port
- SMTP_SECURE - Use secure connection (default true)
- MAILGUN_API_KEY - Mailgun API key
- MAILGUN_DOMAIN - Mailgun Domain to send from
- SENDINBLUE_API_KEY - SendInBlue API key
- SENDINBLUE_URL - Url to v2.0 API

## Development

```bash
# Running the express server
docker run -it \
  -e DB_HOST=db \
  -e DB_USER=someuser \
  -e DB_PASS=somepassword \
  -e DB_PORT=3306 \
  -e DB_NAME=mailer \
  -e SMTP_SERVER=smtp.mailtrap.io \
  -e SMTP_USER=mailtrapuser \
  -e SMTP_PASS=mailtrappassword \
  -e SMTP_PORT=2525 \
  -e SMTP_SECURE=0 \
  --network some_network \
  mailer
  
# Running the cron
docker run -it \
  -e DB_HOST=db \
  -e DB_USER=someuser \
  -e DB_PASS=somepassword \
  -e DB_PORT=3306 \
  -e DB_NAME=mailer \
  -e SMTP_SERVER=smtp.mailtrap.io \
  -e SMTP_USER=mailtrapuser \
  -e SMTP_PASS=mailtrappassword \
  -e SMTP_PORT=2525 \
  -e SMTP_SECURE=0 \
  --network some_network \
  mailer node /app/build/cron.js
```