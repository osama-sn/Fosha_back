const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { t } = require('../locales');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const lang = req.lang || 'en';

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: t(err.msg, lang),
    }));

    throw new ApiError(400, 'VALIDATION_ERROR', formattedErrors);
  }
  next();
};

module.exports = validate;
