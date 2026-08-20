/**
 * Environment Variable Validator & Config Manager.
 * Ensures the application fails fast at boot if required environment variables are missing.
 */

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌ FATAL ERROR: Missing required environment variables:\n   ${missing.join(', ')}\n Please check your .env file before starting the server.\n`);
    process.exit(1);
  }

  return Object.freeze({
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

module.exports = validateEnv();
