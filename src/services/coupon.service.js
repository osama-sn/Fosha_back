const Coupon = require('../models/coupon.model');
const ApiError = require('../utils/ApiError');

class CouponService {
  /**
   * Create new coupon (Admin / Company Admin)
   */
  async createCoupon(data, creatorUser = null) {
    const { code, discountPercentage, maxDiscountAmount, minTripPrice, validUntil, usageLimit } = data;
    const uppercaseCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      throw new ApiError(400, 'COUPON_ALREADY_EXISTS');
    }

    let companyId = null;
    if (creatorUser && creatorUser.role === 'company_admin') {
      companyId = creatorUser.company ? (creatorUser.company._id || creatorUser.company) : null;
      if (!companyId) {
        throw new ApiError(403, 'COMPANY_ACCOUNT_NOT_LINKED');
      }
    } else if (data.company) {
      companyId = data.company;
    }

    const isProtected = (creatorUser && (creatorUser.isProtected || ['super_admin', 'admin'].includes(creatorUser.role)))
      ? true
      : (data.isProtected === true || data.isProtected === 'true');

    return await Coupon.create({
      code: uppercaseCode,
      discountPercentage: Number(discountPercentage),
      maxDiscountAmount: Number(maxDiscountAmount || 0),
      minTripPrice: Number(minTripPrice || 0),
      validUntil: new Date(validUntil),
      usageLimit: Number(usageLimit || 0),
      company: companyId,
      createdBy: creatorUser ? creatorUser._id : null,
      isProtected,
    });
  }

  /**
   * Validate coupon code for user
   */
  async validateCoupon(code, originalPrice = 0, targetCompanyId = null) {
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

    if (coupon.company && targetCompanyId) {
      const targetCompanyStr = targetCompanyId._id ? targetCompanyId._id.toString() : targetCompanyId.toString();
      if (coupon.company.toString() !== targetCompanyStr) {
        throw new ApiError(400, 'COUPON_NOT_VALID_FOR_COMPANY');
      }
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
   * List all coupons (Admin / Company Admin)
   */
  async getAllCoupons(user = null) {
    let filter = {};
    if (user && user.role === 'company_admin') {
      const companyId = user.company ? (user.company._id || user.company) : null;
      if (!companyId) {
        throw new ApiError(403, 'COMPANY_ACCOUNT_NOT_LINKED');
      }
      filter.company = companyId;
    }
    return await Coupon.find(filter).populate('company', 'name logo').sort({ createdAt: -1 });
  }

  /**
   * Delete coupon (Admin / Company Admin)
   */
  async deleteCoupon(couponId, user = null) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, 'COUPON_NOT_FOUND');
    }

    if (user && user.role === 'company_admin') {
      const companyId = user.company ? (user.company._id || user.company) : null;
      if (!companyId || !coupon.company || coupon.company.toString() !== companyId.toString()) {
        throw new ApiError(403, 'FORBIDDEN');
      }
    }

    await coupon.deleteOne();
    return true;
  }
}

module.exports = new CouponService();
