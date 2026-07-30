const { body } = require('express-validator');

const sendNotificationValidator = [
  body('title').trim().notEmpty().withMessage('VAL_TITLE_REQUIRED'),
  body('body').trim().notEmpty().withMessage('VAL_BODY_REQUIRED'),
];

module.exports = {
  sendNotificationValidator,
};
