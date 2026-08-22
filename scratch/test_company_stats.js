const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const adminAnalyticsService = require('../src/services/adminAnalytics.service');


async function testCompanyStats() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const companyId = '6a81fbd965ed0c03b68e5ad5';
    const stats = await adminAnalyticsService.getCompanyDashboardStats(companyId);
    console.log('Company Dashboard Stats result:');
    console.log(JSON.stringify(stats.financials, null, 2));

    await mongoose.disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
}

testCompanyStats();
