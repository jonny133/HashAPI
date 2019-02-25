const Joi = require('joi');

const Algorithm = Joi.string()
  .regex(/(md4|sha1)/i)
  .required();
const Path = Joi.string()
  .regex(/^(.+)\/([^/]+)$/)
  .min(1)
  .max(256)
  .required();

module.exports = { Algorithm, Path };
