const { t } = require('../locales');

/**
 * Middleware that extracts language from query parameter (`?lang=ar` / `?lang=en`)
 * or `Accept-Language` header ('en' | 'ar'), attaching req.lang and req.t(key).
 */
const langMiddleware = (req, res, next) => {
  let lang = 'en';

  // 1. Check query string `?lang=ar` or `?lang=en`
  if (req.query && req.query.lang) {
    const qLang = String(req.query.lang).trim().toLowerCase();
    if (qLang.startsWith('ar')) {
      lang = 'ar';
    } else if (qLang.startsWith('en')) {
      lang = 'en';
    }
  } else {
    // 2. Check Accept-Language header
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const primaryLang = acceptLang.split(',')[0].trim().toLowerCase();
      if (primaryLang.startsWith('ar')) {
        lang = 'ar';
      } else if (primaryLang.startsWith('en')) {
        lang = 'en';
      }
    }
  }

  req.lang = lang;
  req.t = (key) => t(key, lang);
  next();
};

module.exports = langMiddleware;
