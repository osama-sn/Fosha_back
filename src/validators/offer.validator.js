const { body } = require('express-validator');

const createOfferValidator = [
  body('titleEn').trim().notEmpty().withMessage('VAL_OFFER_TITLE_EN_REQUIRED'),
  body('titleAr').trim().notEmpty().withMessage('VAL_OFFER_TITLE_AR_REQUIRED'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('VAL_OFFER_DISCOUNT_INVALID'),
  body('startDate').optional().isISO8601().withMessage('VAL_INVALID_DATE_FORMAT'),
  body('endDate').optional().isISO8601().withMessage('VAL_INVALID_DATE_FORMAT'),
  body('priority').optional().isInt().withMessage('VAL_PRIORITY_INVALID'),
];

const updateOfferValidator = [
  body('titleEn').optional().trim().notEmpty().withMessage('VAL_OFFER_TITLE_EN_REQUIRED'),
  body('titleAr').optional().trim().notEmpty().withMessage('VAL_OFFER_TITLE_AR_REQUIRED'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('VAL_OFFER_DISCOUNT_INVALID'),
  body('startDate').optional().isISO8601().withMessage('VAL_INVALID_DATE_FORMAT'),
  body('endDate').optional().isISO8601().withMessage('VAL_INVALID_DATE_FORMAT'),
  body('priority').optional().isInt().withMessage('VAL_PRIORITY_INVALID'),
];

module.exports = {
  createOfferValidator,
  updateOfferValidator,
};
