const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  createBookingValidator,
  rejectBookingValidator,
  cancelBookingValidator,
} = require('../validators/booking.validator');

const router = express.Router();

// Protect all booking routes
router.use(protect);

// Create Booking (User / Client)
router.post('/', createBookingValidator, validate, bookingController.createBooking);

// My Bookings (Client)
router.get('/my', bookingController.getMyBookings);

// All Bookings (Super Admin & Company Admin)
router.get(
  '/',
  authorize('super_admin', 'admin', 'company_admin'),
  bookingController.getAllBookings
);

// Approve Booking (Super Admin & Company Admin)
router.patch(
  '/:id/approve',
  authorize('super_admin', 'admin', 'company_admin'),
  bookingController.approveBooking
);

// Reject Booking (Super Admin & Company Admin)
router.patch(
  '/:id/reject',
  authorize('super_admin', 'admin', 'company_admin'),
  rejectBookingValidator,
  validate,
  bookingController.rejectBooking
);

// Get Booking Details
router.get('/:id', bookingController.getBookingById);

// Cancel Booking
router.patch(
  '/:id/cancel',
  cancelBookingValidator,
  validate,
  bookingController.cancelBooking
);

const { uploadPaymentReceipt } = require('../middlewares/paymentUploadMiddleware');

// Update Payment Info & Upload Receipt (Client)
router.patch(
  '/:id/payment',
  uploadPaymentReceipt,
  bookingController.updatePaymentInfo
);

module.exports = router;
