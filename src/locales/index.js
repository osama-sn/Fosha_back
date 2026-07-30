const en = require('./en');
const ar = require('./ar');

const dictionaries = {
  en,
  ar,
};

/**
 * Translates a key based on the selected language.
 * Falls back to English, and then to the key itself if missing.
 *
 * @param {string} key - The dictionary message key
 * @param {string} lang - Language code ('en' | 'ar')
 * @returns {string} Translated message
 */
const t = (key, lang = 'en') => {
  const selectedLang = dictionaries[lang] ? lang : 'en';
  return dictionaries[selectedLang][key] || dictionaries['en'][key] || key;
};

module.exports = {
  t,
  dictionaries,
};
