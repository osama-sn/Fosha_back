const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Review = require('../models/review.model');
const CompanyReview = require('../models/companyReview.model');
const activityService = require('./activity.service');
const adminAnalyticsService = require('./adminAnalytics.service');
const settlementService = require('./settlement.service');
const ApiError = require('../utils/ApiError');
const { getPagingData } = require('../utils/pagination.util');

class AdminService {
  // Delegate Dashboard Analytics & Reports
  async getDashboardStats() {
    return adminAnalyticsService.getDashboardStats();
  }

  async getCompanyDashboardStats(companyId) {
    return adminAnalyticsService.getCompanyDashboardStats(companyId);
  }

  async getCompanyCustomers(companyId, query) {
    return adminAnalyticsService.getCompanyCustomers(companyId, query);
  }

  async getCompanyFinancialReport(companyId, query) {
    return adminAnalyticsService.getCompanyFinancialReport(companyId, query);
  }

  async getMonthlyFinancialReport(params) {
    return adminAnalyticsService.getMonthlyFinancialReport(params);
  }

  async getAllCompaniesMonthlyStats(params) {
    return adminAnalyticsService.getAllCompaniesMonthlyStats(params);
  }

  // Delegate Settlements
  async getMonthlySettlements(params) {
    return settlementService.getMonthlySettlements(params);
  }

  async recordSettlementPayment(params, adminUser) {
    return settlementService.recordSettlementPayment(params, adminUser);
  }

  /**
   * Get paginated users
   */
  async getUsers({ page = 1, limit = 10, search = '', role, isBlocked }) {
    const filter = { isDeleted: { $ne: true } };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [{ fullName: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    if (role) {
      filter.role = role;
    }

    if (isBlocked !== undefined && isBlocked !== '') {
      filter.isBlocked = isBlocked === 'true' || isBlocked === true;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return getPagingData(users, total, Number(page), Number(limit), 'users');
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password').populate('company');
    if (!user || user.isDeleted) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Block a user
   */
  async blockUser(userId, { reason }, adminUser) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    if (['super_admin', 'admin'].includes(user.role)) {
      throw new ApiError(403, 'CANNOT_BLOCK_ADMIN_USER');
    }

    user.isBlocked = true;
    user.blockReason = reason || '';
    user.blockedAt = new Date();
    await user.save();

    try {
      await activityService.logActivity({
        actor: adminUser._id,
        actorType: 'Admin',
        action: 'BLOCK_USER',
        targetType: 'User',
        targetId: user._id,
        details: `Blocked user ${user.fullName} (${user.email}). Reason: ${reason || 'N/A'}`,
      });
    } catch (e) {}

    return user;
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId, adminUser) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    user.isBlocked = false;
    user.blockReason = '';
    user.blockedAt = null;
    await user.save();

    try {
      await activityService.logActivity({
        actor: adminUser._id,
        actorType: 'Admin',
        action: 'UNBLOCK_USER',
        targetType: 'User',
        targetId: user._id,
        details: `Unblocked user ${user.fullName} (${user.email}).`,
      });
    } catch (e) {}

    return user;
  }

  /**
   * Get all reviews (Trip or Company reviews) for moderation
   */
  async getAllReviews({ page = 1, limit = 10, type = 'all', search = '', isHidden }) {
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (isHidden !== undefined && isHidden !== '') {
      filter.isHidden = isHidden === 'true' || isHidden === true;
    }

    let reviews = [];
    let total = 0;

    if (type === 'company') {
      [reviews, total] = await Promise.all([
        CompanyReview.find(filter)
          .populate('user', 'fullName profileImage email')
          .populate('company', 'name logo')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        CompanyReview.countDocuments(filter),
      ]);
    } else {
      [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate('user', 'fullName profileImage email')
          .populate('trip', 'title coverImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Review.countDocuments(filter),
      ]);
    }

    return getPagingData(reviews, total, Number(page), Number(limit), 'reviews');
  }

  /**
   * Toggle visibility of a review (Hide/Show)
   */
  async toggleReviewVisibility(reviewId, { type = 'trip', isHidden, reason }, adminUser) {
    const Model = type === 'company' ? CompanyReview : Review;
    const review = await Model.findById(reviewId);

    if (!review) {
      throw new ApiError(404, 'REVIEW_NOT_FOUND');
    }

    review.isHidden = isHidden === true || isHidden === 'true';
    review.hideReason = reason || '';
    await review.save();

    try {
      await activityService.logActivity({
        actor: adminUser._id,
        actorType: 'Admin',
        action: 'TOGGLE_REVIEW_VISIBILITY',
        targetType: type === 'company' ? 'CompanyReview' : 'Review',
        targetId: reviewId,
        details: `${review.isHidden ? 'Hidden' : 'Showed'} review. Reason: ${reason || 'N/A'}`,
      });
    } catch (e) {}

    return review;
  }

  /**
   * Update trip status or hide/unhide trip (Super Admin)
   */
  async updateTripStatus(tripId, { status, isHidden }, adminUser) {
    const trip = await Trip.findById(tripId);
    if (!trip || trip.isDeleted) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    if (status) trip.status = status;
    if (isHidden !== undefined) trip.isHidden = isHidden === true || isHidden === 'true';

    await trip.save();

    try {
      await activityService.logActivity({
        actor: adminUser._id,
        actorType: 'Admin',
        action: 'UPDATE_TRIP_STATUS',
        targetType: 'Trip',
        targetId: trip._id,
        details: `Updated trip status to ${trip.status}, isHidden=${trip.isHidden}`,
      });
    } catch (e) {}

    return trip;
  }

  /**
   * Update booking payment status (Super Admin)
   */
  async updateBookingPaymentStatus(bookingId, { paymentStatus }, adminUser) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    try {
      await activityService.logActivity({
        actor: adminUser._id,
        actorType: 'Admin',
        action: 'UPDATE_BOOKING_PAYMENT_STATUS',
        targetType: 'Booking',
        targetId: booking._id,
        details: `Updated booking payment status to ${paymentStatus}`,
      });
    } catch (e) {}

    return booking;
  }
}

module.exports = new AdminService();
