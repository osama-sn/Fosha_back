const { t } = require('../locales');

class ApiResponse {
  /**
   * Standard API Response Builder.
   *
   * @param {number} statusCode - HTTP status code (200, 201, etc.)
   * @param {string} code - Constant message key (e.g., 'LOGIN_SUCCESS')
   * @param {Object|Array|null} data - Data payload
   * @param {string} lang - Language code ('en' | 'ar')
   */
  constructor(statusCode, code = 'OPERATION_SUCCESS', data = null, lang = 'en') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.code = code;
    this.message = t(code, lang);
    this.data = data;
  }
}

module.exports = ApiResponse;
