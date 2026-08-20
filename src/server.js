require('dotenv').config();
const http = require('http');
const app = require('./app');
const envConfig = require('./config/env.config');
const connectDB = require('./config/db');
const initCronJobs = require('./config/cron');
const initEvents = require('./events');
const migrationService = require('./services/migration.service');
const { initSocket } = require('./socket/socketHandler');
const setupGracefulShutdown = require('./utils/gracefulShutdown');
const logger = require('./utils/logger');

const httpServer = http.createServer(app);

// Initialize Socket.io Live Chat
initSocket(httpServer);

// Initialize Domain Event Listeners (Observer Pattern)
initEvents();

// Setup Production Graceful Shutdown Handler
setupGracefulShutdown(httpServer);

connectDB()
  .then(async () => {
    // Run initial data migration & default company setup
    await migrationService.ensureDefaultCompanyAndMigrate();

    httpServer.listen(envConfig.port, () => {
      logger.info(`⚙️  Server and Live WebSocket Chat are running on port ${envConfig.port} [${envConfig.nodeEnv}]`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed !!!', err);
  });
