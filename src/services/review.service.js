const Review = require('../models/review.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');

class ReviewService {
  /**
   * Add a review for a trip
   */
  async createReview(userId, tripId, { rating, comment, isProtected }, creatorUser = null) {
    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    // Check if user has an approved booking for this trip
    const approvedBooking = await Booking.findOne({ user: userId, trip: tripId, status: 'approved' });
    if (!approvedBooking) {
      throw new ApiError(400, 'BOOKING_REQUIRED_FOR_REVIEW');
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
