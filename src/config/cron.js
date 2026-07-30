const cron = require('node-cron');
const cleanupService = require('../services/cleanup.service');

const initCronJobs = () => {
  const retentionHours = Number(process.env.DEMO_DATA_RETENTION_HOURS || 24);

  // Schedule hourly cleanup of demo/student data older than retentionHours ('0 * * * *')
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupService.cleanupOldDemoData(retentionHours);
    } catch (error) {
      console.error('❌ Error executing scheduled demo data cleanup cron:', error.message);
    }
  });

  console.log(`⏰ Demo Auto-Cleanup Cron Job initialized (Runs hourly to purge student data > ${retentionHours}h).`);
};

module.exports = initCronJobs;
