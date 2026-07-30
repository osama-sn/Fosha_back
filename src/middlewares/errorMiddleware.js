const { t } = require('../locales');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND'));
};

const errorHandler = (err, req, res, next) => {
  const lang = req.lang || 'en';
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors || [];

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    code = 'NOT_FOUND';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: t(e.message, lang) || e.message,
    }));
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'email') code = 'EMAIL_ALREADY_EXISTS';
    else if (field === 'phone') code = 'PHONE_ALREADY_EXISTS';
    else code = 'VALIDATION_ERROR';
  }

  // Format array errors if provided by express-validator
  if (Array.isArray(errors) && errors.length > 0) {
    errors = errors.map((e) => ({
      field: e.field || e.path || e.param || '',
      message: t(e.message, lang) || e.message,
    }));
  }

  const message = t(code, lang);

  const response = {
    success: false,
    statusCode,
    code,
    message,
    errors: errors.length > 0 ? errors : [],
    data: null,
  };

  if (process.env.NODE_ENV === 'development') {
    response.devMessage = err.message;
    if (statusCode === 500) {
      response.stack = err.stack;
    }
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
