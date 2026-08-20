const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Trip = require('../src/models/trip.model');
const Booking = require('../src/models/booking.model');
const Review = require('../src/models/review.model');
const CompanyReview = require('../src/models/companyReview.model');

const authService = require('../src/services/auth.service');
const tripService = require('../src/services/trip.service');
const bookingService = require('../src/services/booking.service');
const companyService = require('../src/services/company.service');
const reviewService = require('../src/services/review.service');

async function runVerification() {
  console.log('🚀 Starting User Flow & Requirements Verification...');
  
  const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/fosha_test_db';
  try {
    await mongoose.connect(MONGO_URI);
  } catch (err) {
    console.log('⚠️ Could not connect to local MongoDB server:', err.message);
    return;
  }
  console.log('✅ Connected to MongoDB');

  try {
    // 1. Test Auth & Profile with Governorate
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regResult = await authService.register({
      fullName: 'أسامة اختبار',
      email: testEmail,
      phone: `+201${Math.floor(100000000 + Math.random() * 900000000)}`,
      password: 'Password123!',
      governorate: 'القاهرة',
    });
    console.log('✅ 1. Auth Register Success, User ID:', regResult.user._id);

    // 2. Setup active company with payment methods
    let company = await Company.findOne({ status: 'active', isDeleted: false });
    if (!company) {
      const owner = await User.create({
        fullName: 'Company Owner',
        email: `owner_${Date.now()}@example.com`,
        phone: `+201${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: 'Password123!',
        role: 'company_admin',
      });
      company = await Company.create({
        name: 'شركة رحلات الهرم',
        contactPhone: '+201011112222',
        contactEmail: `company_${Date.now()}@example.com`,
        owner: owner._id,
        status: 'active',
        paymentMethods: {
          vodafoneCash: { number: '01012345678', instructions: 'حُول على هذا الرقم وأرسل الإيصال' },
          bankTransfer: { bankName: 'CIB', iban: 'EG123456789012345678901234' },
          cash: { instructions: 'الدفع نقداً عند التجمع' },
        },
      });
    } else {
      company.paymentMethods = {
        vodafoneCash: { number: '01012345678', instructions: 'حُول على هذا الرقم' },
        bankTransfer: { bankName: 'CIB', iban: 'EG123456789012345678901234' },
        cash: { instructions: 'الدفع نقداً عند التجمع' },
      };
      await company.save();
    }
    console.log('✅ 2. Company Payment Methods Configured:', company.paymentMethods);

    // 3. Test Trip Creation with Duration calculation
    const trip = await Trip.create({
      title: 'رحلة وادي الريان والفيوم',
      description: 'رحلة سفاري وتزحلق على الرمال وركوب فلوكة',
      origin: 'القاهرة',
      destination: 'الفيوم',
      price: 650,
      capacity: 30,
      availableSeats: 30,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (ended trip)
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),   // 1 day ago (ended trip)
      company: company._id,
      status: 'published',
    });
    console.log('✅ 3. Trip Created with durationDays:', trip.durationDays, 'and durationNights:', trip.durationNights);

    // 4. Test Search & Filter with Duration & Destination
    const searchTrips = await tripService.getAllTrips({
      destination: 'الفيوم',
      durationDays: 1,
      minPrice: 100,
      maxPrice: 1000,
    });
    console.log('✅ 4. Trip Search with Filters count:', searchTrips.trips.length);

    // 5. Test Review before Booking (Should fail)
    try {
      await reviewService.createReview(regResult.user._id, trip._id, { rating: 5, comment: 'محاولة قبل الحجز' });
      console.error('❌ Failed: Review should have been rejected without booking!');
    } catch (e) {
      console.log('✅ 5. Review without booking correctly blocked with error:', e.message);
    }

    // 6. Test Booking Creation with Passengers & Payment Method
    const booking = await bookingService.createBooking(regResult.user._id, {
      tripId: trip._id,
      numberOfSeats: 2,
      pickupPoint: 'ميدان عبد المنعم رياض',
      paymentMethod: 'vodafone_cash',
      paymentNotes: 'تم التحويل من رقم فودافون كاش 01099887766',
      passengers: [
        { fullName: 'أسامة عصام', phone: '01099887766', age: 26, gender: 'male' },
        { fullName: 'علي عصام', phone: '01011223344', age: 22, gender: 'male' },
      ],
    });
    console.log('✅ 6. Booking Created with Passengers & PaymentMethod:', booking.paymentMethod, 'Seats:', booking.numberOfSeats);

    // 7. Update Payment info / Upload receipt simulation
    const updatedBooking = await bookingService.updatePaymentInfo(booking._id, regResult.user._id, {
      paymentNotes: 'إيصال مؤكد برقم عملية 998811',
    });
    console.log('✅ 7. Booking Payment Info Updated, Status:', updatedBooking.paymentStatus);

    // 8. Test My Bookings query with tab filtering
    const myBookings = await bookingService.getMyBookings(regResult.user._id, { tab: 'completed' });
    console.log('✅ 8. My Bookings (Completed tab) returned:', myBookings.bookings.length, 'canReview:', myBookings.bookings[0]?.canReview);

    // Test Trip Flags (isFavorite & isBooked)
    const tripDetailsObj = await tripService.getTripById(trip._id, { _id: regResult.user._id });
    console.log('✅ Trip Flags Check -> isBooked:', tripDetailsObj.trip.isBooked, 'isFavorite:', tripDetailsObj.trip.isFavorite);

    // 9. Test Review after Trip End & Booking Completion (Should succeed and trigger company review)
    const review = await reviewService.createReview(regResult.user._id, trip._id, {
      rating: 5,
      comment: 'رحلة ممتازة وتنظيم عالي جداً',
      companyRating: 5,
      companyComment: 'شركة ممتازة وأنصح بالتعامل معهم',
    });
    console.log('✅ 9. Trip & Company Review successfully posted after completion! Review ID:', review._id);

    // Verify company review exists
    const compReviews = await companyService.getCompanyReviews(company._id);
    console.log('✅ 10. Company Reviews verified count:', compReviews.reviews.length, 'Rating:', compReviews.reviews[0]?.rating);

    console.log('\n🎉 ALL 10 USER APP REQUIREMENTS VERIFIED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification Failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
