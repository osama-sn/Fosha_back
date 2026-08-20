const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Handles graceful shutdown signals (SIGINT / SIGTERM) to prevent data corruption
 * and safely close MongoDB connections and HTTP servers on deployment/restart.
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed.');

      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB connection shutdown:', err);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if stuck
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = setupGracefulShutdown;
