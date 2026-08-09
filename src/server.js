require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const initCronJobs = require('./config/cron');
const migrationService = require('./services/migration.service');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(async () => {
    // Run initial data migration & default company setup
    await migrationService.ensureDefaultCompanyAndMigrate();

    app.listen(PORT, () => {
      console.log(`⚙️  Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed !!! ', err);
  });
