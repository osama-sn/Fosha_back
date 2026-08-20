const Review = require('../models/review.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');

class ReviewService {
  /**
   * Add a review for a trip (Requires completed booking after trip end date)
   */
  async createReview(userId, tripId, { rating, comment, companyRating, companyComment, isProtected }, creatorUser = null) {
    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    // Check if user has a completed booking (explicit completed status or approved status with trip endDate past)
    const completedBooking = await Booking.findOne({
      user: userId,
      trip: tripId,
      $or: [
        { status: 'completed' },
        { status: 'approved', 'tripSnapshot.endDate': { $lte: new Date() } },
        { status: 'approved' }, // Allow approved if trip endDate <= now or trip has completed
      ],
    });

    const isTripEnded = trip.endDate ? new Date(trip.endDate) <= new Date() : true;

    if (!completedBooking || (!isTripEnded && completedBooking.status !== 'completed')) {
      throw new ApiError(400, 'COMPLETED_BOOKING_REQUIRED_FOR_REVIEW');
    }

    // Check if user has already reviewed this trip
    const existingReview = await Review.findOne({ trip: tripId, user: userId });
    if (existingReview) {
      throw new ApiError(400, 'REVIEW_ALREADY_EXISTS');
    }

    const isProtectedReview = (creatorUser && (creatorUser.isProtected || creatorUser.role === 'admin'))
      ? true
      : (isProtected === true || isProtected === 'true');

    const review = await Review.create({
      trip: tripId,
      user: userId,
      rating: Number(rating),
      comment,
      isProtected: isProtectedReview,
    });

    // Optionally process company review if company rating or comment is provided
    if (companyRating || companyComment) {
      try {
        const companyService = require('./company.service');
        await companyService.addCompanyReview(trip.company, userId, {
          rating: companyRating ? Number(companyRating) : Number(rating),
          comment: companyComment || comment || '',
        });
      } catch (e) {
        console.error('⚠️ Note: Dual company review creation note:', e.message);
      }
    }

    await review.populate('user', 'fullName profileImage');
    return review;
  }

  /**
   * Get reviews for a trip
   */
  async getTripReviews(tripId, query) {
    const { page, limit, skip } = getPagination(query);

    const filter = { trip: tripId };
    const reviews = await Review.find(filter)
      .populate('user', 'fullName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Review.countDocuments(filter);

    return getPagingData(reviews, totalItems, page, limit, 'reviews');
  }
}

module.exports = new ReviewService();
