const crypto = require('crypto');

/**
 * Generates a random 6-digit numeric OTP code.
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hashes an OTP string for secure storage.
 * @param {string} otp
 * @returns {string} SHA-256 hash of the OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = {
  generateOTP,
  hashOTP,
};
