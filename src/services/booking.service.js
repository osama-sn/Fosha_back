const Booking = require('../models/booking.model');
const Trip = require('../models/trip.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');
const { BookingStatus, CommissionType } = require('../constants/enums');
const { CommissionStrategyFactory } = require('../strategies/commissionStrategy');
const appEventEmitter = require('../events/eventEmitter');
const EventTypes = require('../events/eventTypes');

class BookingService {
  /**
   * Create a new booking for a trip
   */
  async createBooking(userId, payload, creatorUser = null) {
    let {
      tripId,
      numberOfSeats = 1,
      notes,
      pickupPoint,
      pickupTime,
      couponCode,
      isProtected,
      passengers,
      paymentMethod,
      paymentSenderNumber,
      paymentSenderInstaPay,
      paymentNotes,
    } = payload;

    const seats = Number(numberOfSeats) || 1;

    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    if (trip.status !== 'published') {
      throw new ApiError(400, 'TRIP_NOT_AVAILABLE_FOR_BOOKING');
    }

    if (trip.availableSeats < seats) {
      throw new ApiError(400, 'NOT_ENOUGH_SEATS');
    }

    // Check if user has an existing active booking (pending or approved) for this trip
    const existingBooking = await Booking.findOne({
      user: userId,
      trip: tripId,
      status: { $in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
    });

    if (existingBooking) {
      throw new ApiError(400, 'ALREADY_BOOKED');
    }

    // Fetch company to calculate commission
    let companyId = trip.company;
    let company = await Company.findById(companyId);
    if (!company) {
      company = await Company.findOne({ isProtected: true });
      companyId = company ? company._id : null;
    }

    if (!companyId) {
      throw new ApiError(400, 'TRIP_COMPANY_NOT_FOUND');
    }

    // Process passengers list
    let processedPassengers = [];
    if (typeof passengers === 'string') {
      try { processedPassengers = JSON.parse(passengers); } catch (e) { processedPassengers = []; }
    } else if (Array.isArray(passengers)) {
      processedPassengers = passengers;
    }

    // Create trip snapshot
    const tripSnapshot = {
      title: trip.title,
      coverImage: trip.coverImage,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      pricePerSeat: trip.price,
    };

    let originalPrice = trip.price * seats;
    let totalPrice = originalPrice;

    // Apply Coupon Discount if couponCode provided
    if (couponCode) {
      const couponService = require('./coupon.service');
      const couponResult = await couponService.validateCoupon(couponCode, originalPrice, companyId);
      totalPrice = couponResult.finalPrice;
      await couponResult.coupon.updateOne({ $inc: { usedCount: 1 } });
    }

    // Calculate Admin Commission & Company Net via Strategy Pattern
    const commissionType = company ? company.commissionType : CommissionType.PERCENTAGE;
    const commissionValue = company ? company.commissionValue : 10;
    const { adminCommissionAmount, companyNetAmount } = CommissionStrategyFactory.calculateCommission({
      commissionType,
      totalPrice,
      seats,
      commissionValue,
    });

    // Decrement available seats on the trip
    trip.availableSeats -= seats;
    await trip.save();

    const isProtectedBooking = (creatorUser && (creatorUser.isProtected || ['super_admin', 'admin'].includes(creatorUser.role)))
      ? true
      : (isProtected === true || isProtected === 'true');

    // Initial Payment status logic
    let initialPaymentStatus = 'unpaid';
    if (paymentMethod === 'cash') {
      initialPaymentStatus = 'pay_on_arrival';
    } else if (paymentMethod) {
      initialPaymentStatus = 'pending_verification';
    }

    const booking = await Booking.create({
      user: userId,
      trip: tripId,
      company: companyId,
      numberOfSeats: seats,
      totalPrice,
      commissionType,
      commissionValue,
      adminCommissionAmount,
      companyNetAmount,
      tripSnapshot,
      passengers: processedPassengers,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: initialPaymentStatus,
      paymentSenderNumber: paymentSenderNumber || '',
      paymentSenderInstaPay: paymentSenderInstaPay || '',
      paymentNotes: paymentNotes || '',
      notes: notes || '',
      pickupPoint: pickupPoint || '',
      pickupTime: pickupTime || '',
      isProtected: isProtectedBooking,
      status: BookingStatus.PENDING,
    });

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail paymentMethods' },
    ]);

    // Emit event asynchronously
    appEventEmitter.emit(EventTypes.BOOKING_CREATED, { booking, trip });

    return booking;
  }

  /**
   * Update Payment Information & Upload Payment Receipt Screenshot (User/Client)
   */
  async updatePaymentInfo(bookingId, userId, { paymentMethod, paymentSenderNumber, paymentSenderInstaPay, paymentNotes }, file = null) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
      if (paymentMethod === 'cash') {
        booking.paymentStatus = 'pay_on_arrival';
      } else {
        booking.paymentStatus = 'pending_verification';
      }
    }

    if (paymentSenderNumber !== undefined) {
      booking.paymentSenderNumber = paymentSenderNumber;
    }

    if (paymentSenderInstaPay !== undefined) {
      booking.paymentSenderInstaPay = paymentSenderInstaPay;
    }

    if (paymentNotes !== undefined) {
      booking.paymentNotes = paymentNotes;
    }

    if (file) {
      booking.paymentReceiptImage = `/uploads/payments/${file.filename}`;
      booking.paymentStatus = 'pending_verification';
    }

    await booking.save();
    await booking.populate([
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail paymentMethods' },
    ]);

    return booking;
  }

  /**
   * Get user's own bookings with tab filters (upcoming, completed, cancelled) and canReview status
   */
  async getMyBookings(userId, query) {
    const { page, limit, skip } = getPagination(query);

    const filter = { user: userId };
    const now = new Date();

    if (query.tab === 'upcoming') {
      filter.status = { $in: ['pending', 'approved'] };
      filter['tripSnapshot.endDate'] = { $gte: now };
    } else if (query.tab === 'completed') {
      filter.$or = [
        { status: 'completed' },
        { status: 'approved', 'tripSnapshot.endDate': { $lt: now } },
      ];
    } else if (query.tab === 'cancelled') {
      filter.status = { $in: ['cancelled', 'rejected'] };
    } else if (query.status) {
      filter.status = query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('trip', 'title origin destination startDate endDate price coverImage status averageRating reviewsCount')
      .populate('company', 'name logo averageRating reviewsCount contactPhone contactEmail whatsapp paymentMethods')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Booking.countDocuments(filter);

    // Populate canReview and isReviewed status for each booking
    const Review = require('../models/review.model');
    const tripService = require('./trip.service');

    const userReviews = await Review.find({ user: userId }).distinct('trip');
    const reviewedTripIds = new Set(userReviews.map((id) => id.toString()));

    const rawTrips = bookings.map((b) => b.trip).filter((t) => t !== null && t !== undefined);
    const tripsWithFlags = await tripService._attachUserFlags(rawTrips, { _id: userId });
    const tripMap = new Map(tripsWithFlags.map((t) => [t._id.toString(), t]));

    const bookingsWithReviewStatus = bookings.map((b) => {
      const bObj = b.toObject();
      if (bObj.trip && bObj.trip._id) {
        bObj.trip = tripMap.get(bObj.trip._id.toString()) || bObj.trip;
      }
      const tripEndDate = b.tripSnapshot && b.tripSnapshot.endDate ? new Date(b.tripSnapshot.endDate) : now;
      const isPast = tripEndDate <= now;
      const isCompletedOrPastApproved = b.status === 'completed' || (b.status === 'approved' && isPast);
      const isReviewed = reviewedTripIds.has(b.trip ? b.trip._id.toString() : '');

      bObj.isCompleted = isCompletedOrPastApproved;
      bObj.isReviewed = isReviewed;
      bObj.canReview = isCompletedOrPastApproved && !isReviewed;

      return bObj;
    });

    const paginatedData = getPagingData(bookingsWithReviewStatus, totalItems, page, limit, 'bookings');
    return paginatedData;
  }

  /**
   * Get all bookings (Admin / Company Admin)
   */
  async getAllBookings(query, user = null) {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (user && user.role === 'company_admin') {
      const companyId = user.company._id || user.company;
      filter.company = companyId;
    } else if (query.companyId) {
      filter.company = query.companyId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.tripId) {
      filter.trip = query.tripId;
    }

    if (query.userId) {
      filter.user = query.userId;
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'fullName email phone profileImage')
      .populate('trip', 'title origin destination startDate endDate price coverImage status')
      .populate('company', 'name logo contactPhone contactEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Booking.countDocuments(filter);

    return getPagingData(bookings, totalItems, page, limit, 'bookings');
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId, userId, userRole = 'user', userCompany = null) {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'fullName email phone profileImage')
      .populate('trip', 'title origin destination startDate endDate price coverImage status')
      .populate('company', 'name logo contactPhone contactEmail');

    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    const isSuperAdmin = ['super_admin', 'admin'].includes(userRole);
    const isCompanyAdmin = userRole === 'company_admin';
    const isOwnerUser = booking.user._id.toString() === userId.toString();

    if (!isSuperAdmin && !isOwnerUser) {
      if (isCompanyAdmin && userCompany) {
        const companyIdStr = userCompany._id ? userCompany._id.toString() : userCompany.toString();
        if (booking.company._id.toString() !== companyIdStr) {
          throw new ApiError(403, 'FORBIDDEN');
        }
      } else {
        throw new ApiError(403, 'FORBIDDEN');
      }
    }

    const bObj = booking.toObject();
    if (bObj.trip && userId) {
      const tripService = require('./trip.service');
      const [tripWithFlags] = await tripService._attachUserFlags([bObj.trip], { _id: userId });
      bObj.trip = tripWithFlags;
    }

    return bObj;
  }

  /**
   * Approve a booking
   */
  async approveBooking(bookingId, user = null) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    if (user && user.role === 'company_admin') {
      const userCompanyId = user.company._id ? user.company._id.toString() : user.company.toString();
      if (booking.company.toString() !== userCompanyId) {
        throw new ApiError(403, 'FORBIDDEN_NOT_COMPANY_BOOKING');
      }
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new ApiError(400, 'CANNOT_APPROVE_BOOKING');
    }

    booking.status = BookingStatus.APPROVED;
    booking.approvedAt = new Date();

    if (['pending_verification', 'unpaid'].includes(booking.paymentStatus)) {
      booking.paymentStatus = 'paid';
    }

    await booking.save();

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    // Emit event asynchronously
    appEventEmitter.emit(EventTypes.BOOKING_APPROVED, { booking });

    return booking;
  }

  /**
   * Reject a booking
   */
  async rejectBooking(bookingId, rejectionReason, user = null) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    if (user && user.role === 'company_admin') {
      const userCompanyId = user.company._id ? user.company._id.toString() : user.company.toString();
      if (booking.company.toString() !== userCompanyId) {
        throw new ApiError(403, 'FORBIDDEN_NOT_COMPANY_BOOKING');
      }
    }

    if ([BookingStatus.REJECTED, BookingStatus.CANCELLED].includes(booking.status)) {
      throw new ApiError(400, 'CANNOT_REJECT_BOOKING');
    }

    // Restore seats to the trip
    const trip = await Trip.findById(booking.trip);
    if (trip) {
      trip.availableSeats += booking.numberOfSeats;
      await trip.save();
    }

    booking.status = BookingStatus.REJECTED;
    booking.rejectionReason = rejectionReason || '';
    booking.rejectedAt = new Date();
    await booking.save();

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    // Emit event asynchronously
    appEventEmitter.emit(EventTypes.BOOKING_REJECTED, { booking, rejectionReason });

    return booking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, userId, cancellationReason, cancelledByRole = 'user') {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new ApiError(404, 'BOOKING_NOT_FOUND');
    }

    if ([BookingStatus.REJECTED, BookingStatus.CANCELLED].includes(booking.status)) {
      throw new ApiError(400, 'BOOKING_ALREADY_CANCELLED_OR_REJECTED');
    }

    // Restore seats to the trip
    const trip = await Trip.findById(booking.trip);
    if (trip) {
      trip.availableSeats += booking.numberOfSeats;
      await trip.save();
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = cancellationReason || '';
    booking.cancelledBy = cancelledByRole;
    booking.cancelledAt = new Date();
    await booking.save();

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    return booking;
  }
}

module.exports = new BookingService();
