const { body } = require('express-validator');

const createBookingValidator = [
  body('tripId').isMongoId().withMessage('VAL_TRIP_ID_REQUIRED'),
  body('numberOfSeats').optional().isInt({ min: 1 }).withMessage('VAL_SEATS_MIN'),
  body('notes').optional().trim(),
  body('pickupPoint').optional().trim(),
  body('pickupTime').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer', 'cash'])
    .withMessage('VAL_INVALID_PAYMENT_METHOD'),
  body('paymentNotes').optional().trim(),
  body('passengers').optional(),
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
