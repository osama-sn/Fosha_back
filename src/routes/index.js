const express = require('express');
const ApiResponse = require('../utils/ApiResponse');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');
const bookingRoutes = require('./booking.routes');
const companyRoutes = require('./company.routes');
const favoriteRoutes = require('./favorite.routes');
const notificationRoutes = require('./notification.routes');
const categoryRoutes = require('./category.routes');
const couponRoutes = require('./coupon.routes');
const offerRoutes = require('./offer.routes');
const adminRoutes = require('./admin.routes');
const homeRoutes = require('./home.routes');
const expenseRoutes = require('./expense.routes');
const chatRoutes = require('./chat.routes');
const settingsRoutes = require('./settings.routes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'OPERATION_SUCCESS', {}, req.lang));
});

// Home Page API
router.use('/home', homeRoutes);

// Authentication Routes
router.use('/auth', authRoutes);

// Travel Companies Routes
router.use('/companies', companyRoutes);

// Trip & Review Routes
router.use('/trips', tripRoutes);

// Booking Routes
router.use('/bookings', bookingRoutes);

// Favorites Routes
router.use('/favorites', favoriteRoutes);

// Notification Routes
router.use('/notifications', notificationRoutes);

// Trip Categories Routes
router.use('/categories', categoryRoutes);

// Promo Coupons Routes
router.use('/coupons', couponRoutes);

// Offers & Banners Routes
router.use('/offers', offerRoutes);

// Admin Analytics Dashboard Routes
router.use('/admin', adminRoutes);

// Expenses Management Routes
router.use('/expenses', expenseRoutes);

// Chat & Messaging Routes
router.use('/chats', chatRoutes);

// Platform Settings Routes
router.use('/settings', settingsRoutes);

module.exports = router;
