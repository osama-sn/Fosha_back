const { body } = require('express-validator');

const createTripValidator = [
  body('title').trim().notEmpty().withMessage('VAL_TRIP_TITLE_REQUIRED'),
  body('description').trim().notEmpty().withMessage('VAL_TRIP_DESCRIPTION_REQUIRED'),
  body('origin').trim().notEmpty().withMessage('VAL_TRIP_ORIGIN_REQUIRED'),
  body('destination').trim().notEmpty().withMessage('VAL_TRIP_DESTINATION_REQUIRED'),
  body('price').isFloat({ min: 0 }).withMessage('VAL_TRIP_PRICE_INVALID'),
  body('capacity').isInt({ min: 1 }).withMessage('VAL_TRIP_CAPACITY_INVALID'),
  body('startDate').notEmpty().withMessage('VAL_TRIP_START_DATE_REQUIRED').isISO8601(),
  body('endDate').notEmpty().withMessage('VAL_TRIP_END_DATE_REQUIRED').isISO8601(),
  body('category').optional().trim(),
];

const updateTripValidator = [
  body('title').optional().trim().notEmpty().withMessage('VAL_TRIP_TITLE_REQUIRED'),
  body('description').optional().trim().notEmpty().withMessage('VAL_TRIP_DESCRIPTION_REQUIRED'),
  body('price').optional().isFloat({ min: 0 }).withMessage('VAL_TRIP_PRICE_INVALID'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('VAL_TRIP_CAPACITY_INVALID'),
  body('category').optional().trim(),
];

const republishTripValidator = [
  body('startDate').notEmpty().withMessage('VAL_TRIP_START_DATE_REQUIRED').isISO8601(),
  body('endDate').notEmpty().withMessage('VAL_TRIP_END_DATE_REQUIRED').isISO8601(),
  body('capacity').optional().isInt({ min: 1 }).withMessage('VAL_TRIP_CAPACITY_INVALID'),
];

module.exports = {
  createTripValidator,
  updateTripValidator,
  republishTripValidator,
};
