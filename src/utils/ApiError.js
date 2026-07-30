class ApiError extends Error {
  /**
   * Custom Application Error.
   *
   * @param {number} statusCode - HTTP Status Code (400, 401, 404, 409, 500, etc.)
   * @param {string} code - Constant message key (e.g. 'EMAIL_ALREADY_EXISTS')
   * @param {Array} errors - Optional array of field errors
   * @param {string} stack - Optional stack trace
   */
  constructor(statusCode, code = 'INTERNAL_SERVER_ERROR', errors = [], stack = '') {
    super(code);
    this.statusCode = statusCode;
    this.code = code;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
