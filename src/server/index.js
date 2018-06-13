const winston = require('winston');
const TcpTransport = require('./tcp').default;

const console = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  )
});
const tcp = new TcpTransport({
  host: '127.0.0.1',
  port: 10518,
  timestamp: true,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json())
});

const logger = winston.createLogger({
  transports: [tcp, console]
});

logger.info('log me', {
  logger: {
    name: 'LogMe'
  }
});

const express = require('express');
const os = require('os');

const app = express();

app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => {
  logger.info(`username is ${os.userInfo().username}`, {
    logger: {
      name: 'GetUsername'
    }
  });
  res.send({ username: os.userInfo().username });
});
app.listen(8080, () => console.log('Listening on port 8080!'));
