const { body } = require('express-validator');

const createReviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('VAL_RATING_REQUIRED'),
  body('comment').trim().notEmpty().withMessage('VAL_COMMENT_REQUIRED'),
];

module.exports = {
  createReviewValidator,
};
