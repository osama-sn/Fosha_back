const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { uploadProfileImage } = require('../middlewares/uploadMiddleware');
const {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  refreshTokenValidator,
} = require('../validators/auth.validator');

const router = express.Router();

// Public Routes
router.post('/register', uploadProfileImage, registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/google', googleLoginValidator, validate, authController.googleLogin);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

// Protected Routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, uploadProfileImage, updateProfileValidator, validate, authController.updateProfile);
router.patch('/change-password', protect, changePasswordValidator, validate, authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
