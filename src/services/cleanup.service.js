const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Favorite = require('../models/favorite.model');
const Notification = require('../models/notification.model');
const Review = require('../models/review.model');
const Category = require('../models/category.model');
const Coupon = require('../models/coupon.model');
const Offer = require('../models/offer.model');

class CleanupService {
  /**
   * Cleans up all student/demo data older than 24 hours while preserving developer protected data.
   */
  async cleanupOldDemoData(hours = 24) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    console.log(`🧹 Starting Demo Auto-Cleanup for data older than ${hours} hours (Cutoff: ${cutoffDate.toISOString()})...`);

    // 1. Cleanup student/demo bookings older than 24 hours (isProtected !== true)
    const oldBookings = await Booking.find({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    // Restore available seats on trips if active bookings are deleted
    for (const booking of oldBookings) {
      if (['pending', 'approved'].includes(booking.status)) {
        await Trip.findByIdAndUpdate(booking.trip, {
          $inc: { availableSeats: booking.numberOfSeats },
        });
      }
    }

    const bookingDeleteResult = await Booking.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    // 2. Cleanup student favorites, notifications, and reviews older than 24 hours (isProtected !== true)
    const favoriteDeleteResult = await Favorite.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    const notificationDeleteResult = await Notification.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    const reviewDeleteResult = await Review.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    // 3. Cleanup student-created trips older than 24 hours (isProtected !== true)
    const tripDeleteResult = await Trip.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    // 4. Cleanup student categories, coupons, and offers older than 24 hours (isProtected !== true)
    const categoryDeleteResult = await Category.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    const couponDeleteResult = await Coupon.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    const offerDeleteResult = await Offer.deleteMany({
      isProtected: { $ne: true },
      createdAt: { $lt: cutoffDate },
    });

    // 5. Cleanup student user accounts older than 24 hours (isProtected !== true & role !== 'admin')
    const userDeleteResult = await User.deleteMany({
      isProtected: { $ne: true },
      role: { $ne: 'admin' },
      createdAt: { $lt: cutoffDate },
    });

    const summary = {
      deletedUsers: userDeleteResult.deletedCount || 0,
      deletedBookings: bookingDeleteResult.deletedCount || 0,
      deletedTrips: tripDeleteResult.deletedCount || 0,
      deletedFavorites: favoriteDeleteResult.deletedCount || 0,
      deletedNotifications: notificationDeleteResult.deletedCount || 0,
      deletedReviews: reviewDeleteResult.deletedCount || 0,
      deletedCategories: categoryDeleteResult.deletedCount || 0,
      deletedCoupons: couponDeleteResult.deletedCount || 0,
      deletedOffers: offerDeleteResult.deletedCount || 0,
      cleanedAt: new Date(),
    };

    console.log(`✅ Demo Auto-Cleanup Completed:`, summary);
    return summary;
  }
}

module.exports = new CleanupService();
