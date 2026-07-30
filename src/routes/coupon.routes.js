const express = require('express');
const couponController = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// User Route: Validate Coupon
router.post('/validate', protect, couponController.validateCoupon);

// Admin Routes
router.post('/', protect, authorize('admin'), couponController.createCoupon);
router.get('/', protect, authorize('admin'), couponController.getAllCoupons);
router.delete('/:id', protect, authorize('admin'), couponController.deleteCoupon);

module.exports = router;
