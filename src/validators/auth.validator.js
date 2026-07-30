const { body } = require('express-validator');

const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('VAL_FULL_NAME_REQUIRED'),
  body('email').trim().notEmpty().withMessage('VAL_EMAIL_REQUIRED').isEmail().withMessage('VAL_EMAIL_INVALID'),
  body('phone').trim().notEmpty().withMessage('VAL_PHONE_REQUIRED'),
  body('password').notEmpty().withMessage('VAL_NEW_PASSWORD_REQUIRED').isLength({ min: 6 }).withMessage('VAL_PASSWORD_MIN'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('VAL_CONFIRM_PASSWORD_MATCH');
    }
    return true;
  }),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('VAL_EMAIL_REQUIRED').isEmail().withMessage('VAL_EMAIL_INVALID'),
  body('password').notEmpty().withMessage('VAL_CURRENT_PASSWORD_REQUIRED'),
];

const googleLoginValidator = [body('idToken').trim().notEmpty().withMessage('VAL_ID_TOKEN_REQUIRED')];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('VAL_EMAIL_REQUIRED').isEmail().withMessage('VAL_EMAIL_INVALID'),
];

const resetPasswordValidator = [
  body('email').trim().notEmpty().withMessage('VAL_EMAIL_REQUIRED').isEmail().withMessage('VAL_EMAIL_INVALID'),
  body('otp').trim().notEmpty().withMessage('VAL_OTP_REQUIRED'),
  body('newPassword').notEmpty().withMessage('VAL_NEW_PASSWORD_REQUIRED').isLength({ min: 6 }).withMessage('VAL_PASSWORD_MIN'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('VAL_CONFIRM_PASSWORD_MATCH');
    }
    return true;
  }),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('VAL_CURRENT_PASSWORD_REQUIRED'),
  body('newPassword').notEmpty().withMessage('VAL_NEW_PASSWORD_REQUIRED').isLength({ min: 6 }).withMessage('VAL_PASSWORD_MIN'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('VAL_CONFIRM_PASSWORD_MATCH');
    }
    return true;
  }),
];

const updateProfileValidator = [
  body('fullName').optional().trim().notEmpty().withMessage('VAL_FULL_NAME_REQUIRED'),
  body('phone').optional().trim().notEmpty().withMessage('VAL_PHONE_REQUIRED'),
];

const refreshTokenValidator = [body('refreshToken').trim().notEmpty().withMessage('VAL_REFRESH_TOKEN_REQUIRED')];

module.exports = {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  refreshTokenValidator,
};
