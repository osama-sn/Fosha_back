const mongoose = require('mongoose');
const Company = require('../src/models/company.model');

async function testCompanyPaymentAccountsLocal() {
  try {
    console.log('Testing Company Schema and paymentAccountSubdocument logic...');

    const company = new Company({
      name: 'Test Payment Accounts Co',
      contactPhone: '+201000000000',
      contactEmail: 'testpay@company.com',
      owner: new mongoose.Types.ObjectId(),
      paymentAccounts: [
        {
          provider: 'vodafone_cash',
          title: 'فودافون كاش 1',
          number: '01011112222',
          isActive: true,
        },
        {
          provider: 'instapay',
          title: 'InstaPay 1',
          handle: 'company@instapay',
          isActive: false,
        }
      ]
    });

    const valErr = company.validateSync();
    if (valErr) {
      throw valErr;
    }

    console.log('Company schema validation passed!');
    console.log('Payment accounts count:', company.paymentAccounts.length);
    console.log('Account 1:', company.paymentAccounts[0]);
    console.log('Account 2 (InstaPay):', company.paymentAccounts[1]);

    // Test toggle isActive
    company.paymentAccounts[1].isActive = !company.paymentAccounts[1].isActive;
    console.log('Toggled InstaPay isActive:', company.paymentAccounts[1].isActive);
    if (company.paymentAccounts[1].isActive !== true) {
      throw new Error('Toggle failed!');
    }

    console.log('Local schema & toggle tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCompanyPaymentAccountsLocal();
