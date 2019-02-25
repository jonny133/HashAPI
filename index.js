require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const hashRouter = require('./routes/hasher').router;

const server = express();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

server.use('/api/hash', hashRouter);

const port = process.env.PORT || 1234;
server.listen(port, () => {
  console.log(`Server started on port ${port}.`);
});
