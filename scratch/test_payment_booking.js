const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { PaymentMethod } = require('../src/constants/enums');
const Booking = require('../src/models/booking.model');
const Company = require('../src/models/company.model');

async function testPaymentBooking() {
  try {
    console.log('Testing Enums:');
    console.log('PaymentMethod:', PaymentMethod);
    if (!PaymentMethod.INSTAPAY || !PaymentMethod.WALLET) {
      throw new Error('INSTAPAY or WALLET missing in PaymentMethod enum!');
    }

    const testBookingDoc = new Booking({
      user: new mongoose.Types.ObjectId(),
      trip: new mongoose.Types.ObjectId(),
      company: new mongoose.Types.ObjectId(),
      numberOfSeats: 1,
      totalPrice: 100,
      paymentMethod: 'instapay',
      paymentSenderInstaPay: 'testuser@instapay',
      paymentSenderNumber: '01012345678',
      tripSnapshot: {
        title: 'Test Trip',
        origin: 'Cairo',
        destination: 'Alex',
        startDate: new Date(),
        endDate: new Date(),
        pricePerSeat: 100
      }
    });

    const validateErr = testBookingDoc.validateSync();
    if (validateErr) {
      console.error('Validation error on Booking document:', validateErr);
      throw validateErr;
    }
    console.log('Booking document schema validation passed!');
    console.log('Fields:', {
      paymentMethod: testBookingDoc.paymentMethod,
      paymentSenderInstaPay: testBookingDoc.paymentSenderInstaPay,
      paymentSenderNumber: testBookingDoc.paymentSenderNumber
    });

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testPaymentBooking();
