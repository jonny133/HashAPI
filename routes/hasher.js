const express = require('express');
const fs = require('fs');
const Joi = require('joi');
const winston = require('winston');
const { Algorithm, Path } = require('../validation/definitions.js');

const router = express.Router();

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

// Check hashing supported by node version used
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('Crypto support is disabled!');
  throw err;
}

// Joi validation
const hasherSchema = Joi.object().keys({ Algorithm, Path });
const validateInput = (Algorithm, Path) => {
  return Joi.validate({ Algorithm, Path }, hasherSchema);
};

// Hashing
const hasher = (Algorithm, Path) => {
  const hash = crypto.createHash(Algorithm).setEncoding('hex');
  let stream;
  try {
    stream = fs.createReadStream(Path);
  } catch (err) {
    throw err;
  }

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Routing
router.use((req, res, next) => {
  // console.log(req.body);
  const { Algorithm, Path } = req.body;
  const inputCheck = validateInput(Algorithm, Path);
  if (inputCheck.error) {
    // throw inputCheck.error;
    logger.info('Input validation failed with error:');
    logger.info(inputCheck.error);
    res.status(400).json({ errorMsg: inputCheck.error.details[0].message });
  } else {
    next();
  }
});

router.get('/', async (req, res) => {
  const { Algorithm, Path } = req.body;
  logger.log(
    'info',
    `Received hash request for path ${Path} using ${Algorithm} algorithm`,
  );
  try {
    const hash = await hasher(Algorithm, Path);
    res.status(200).json({ Algorithm, Hash: hash });
    logger.log(
      'info',
      `Hash completed successfully and sent 200 Response with JSON object ${JSON.stringify(
        {
          Algorithm: Algorithm,
          Hash: hash,
        },
      )}`,
    );
  } catch (err) {
    logger.error(`Hash process failed with ${err}`);
    res.status(500).json({
      errorMsg: `${err}`,
    });
  }
});

module.exports = { hasher, router, validateInput };
