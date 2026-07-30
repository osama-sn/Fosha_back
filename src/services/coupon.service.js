const Coupon = require('../models/coupon.model');
const ApiError = require('../utils/ApiError');

class CouponService {
  /**
   * Create new coupon (Admin)
   */
  async createCoupon(data, creatorUser = null) {
    const { code, discountPercentage, maxDiscountAmount, minTripPrice, validUntil, usageLimit } = data;
    const uppercaseCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      throw new ApiError(400, 'COUPON_ALREADY_EXISTS');
    }

    const isProtected = (creatorUser && (creatorUser.isProtected || creatorUser.role === 'admin'))
      ? true
      : (data.isProtected === true || data.isProtected === 'true');

    return await Coupon.create({
      code: uppercaseCode,
      discountPercentage: Number(discountPercentage),
      maxDiscountAmount: Number(maxDiscountAmount || 0),
      minTripPrice: Number(minTripPrice || 0),
      validUntil: new Date(validUntil),
      usageLimit: Number(usageLimit || 0),
      isProtected,
    });
  }

  /**
   * Validate coupon code for user
   */
  async validateCoupon(code, originalPrice = 0) {
    if (!code) {
      throw new ApiError(400, 'COUPON_INVALID');
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!coupon) {
      throw new ApiError(404, 'COUPON_INVALID');
    }

    if (new Date() > new Date(coupon.validUntil)) {
      throw new ApiError(400, 'COUPON_EXPIRED');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'COUPON_LIMIT_REACHED');
    }

    if (originalPrice > 0 && coupon.minTripPrice > 0 && originalPrice < coupon.minTripPrice) {
      throw new ApiError(400, 'COUPON_INVALID');
    }

    // Calculate discount amount
    let discountAmount = (originalPrice * coupon.discountPercentage) / 100;
    if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      coupon,
      discountPercentage: coupon.discountPercentage,
      discountAmount,
      originalPrice,
      finalPrice,
    };
  }

  /**
   * List all coupons (Admin)
   */
  async getAllCoupons() {
    return await Coupon.find().sort({ createdAt: -1 });
  }

  /**
   * Delete coupon (Admin)
   */
  async deleteCoupon(couponId) {
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      throw new ApiError(404, 'COUPON_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new CouponService();
