const couponService = require('../services/coupon.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class CouponController {
  createCoupon = AsyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body, req.user);
    res.status(201).json(new ApiResponse(201, 'COUPON_CREATED', coupon, req.lang));
  });

  validateCoupon = AsyncHandler(async (req, res) => {
    const targetCompanyId = req.body.companyId || req.body.company || null;
    const result = await couponService.validateCoupon(req.body.code, req.body.originalPrice, targetCompanyId);
    res.status(200).json(new ApiResponse(200, 'COUPON_VALID', result, req.lang));
  });

  getAllCoupons = AsyncHandler(async (req, res) => {
    const coupons = await couponService.getAllCoupons(req.user);
    res.status(200).json(new ApiResponse(200, 'COUPONS_FETCHED', coupons, req.lang));
  });

  deleteCoupon = AsyncHandler(async (req, res) => {
    await couponService.deleteCoupon(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'COUPON_DELETED', {}, req.lang));
  });
}

module.exports = new CouponController();
