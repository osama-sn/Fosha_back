const express = require('express');
const couponController = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// User Route: Validate Coupon
router.post('/validate', protect, couponController.validateCoupon);

// Management Routes (Admin & Company Admin)
router.post('/', protect, authorize('super_admin', 'admin', 'company_admin'), couponController.createCoupon);
router.get('/', protect, authorize('super_admin', 'admin', 'company_admin'), couponController.getAllCoupons);
router.delete('/:id', protect, authorize('super_admin', 'admin', 'company_admin'), couponController.deleteCoupon);

module.exports = router;
