const { body } = require('express-validator');

const createBookingValidator = [
  body('tripId').isMongoId().withMessage('VAL_TRIP_ID_REQUIRED'),
  body('numberOfSeats').optional().isInt({ min: 1 }).withMessage('VAL_SEATS_MIN'),
  body('notes').optional().trim(),
];

const rejectBookingValidator = [
  body('rejectionReason').optional().trim(),
];

const cancelBookingValidator = [
  body('cancellationReason').optional().trim(),
];

module.exports = {
  createBookingValidator,
  rejectBookingValidator,
  cancelBookingValidator,
};
