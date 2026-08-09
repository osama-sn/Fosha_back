const Booking = require('../models/booking.model');
const Trip = require('../models/trip.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');

class BookingService {
  /**
   * Create a new booking for a trip
   */
  async createBooking(userId, { tripId, numberOfSeats = 1, notes, couponCode, isProtected }, creatorUser = null) {
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
      status: { $in: ['pending', 'approved'] },
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

    // Calculate Admin Commission & Company Net
    const commissionType = company ? company.commissionType : 'percentage';
    const commissionValue = company ? company.commissionValue : 10;
    let adminCommissionAmount = 0;

    if (commissionType === 'percentage') {
      adminCommissionAmount = Number(((totalPrice * commissionValue) / 100).toFixed(2));
    } else {
      adminCommissionAmount = Number((commissionValue * seats).toFixed(2));
    }
    const companyNetAmount = Number((totalPrice - adminCommissionAmount).toFixed(2));

    // Decrement available seats on the trip
    trip.availableSeats -= seats;
    await trip.save();

    const isProtectedBooking = (creatorUser && (creatorUser.isProtected || ['super_admin', 'admin'].includes(creatorUser.role)))
      ? true
      : (isProtected === true || isProtected === 'true');

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
      notes,
      isProtected: isProtectedBooking,
      status: 'pending',
    });

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    try {
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        user: userId,
        title: 'طلب حجز جديد',
        body: `تم تقديم طلب حجزك لرحلة (${trip.title}) بنجاح.`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: trip._id },
      });
    } catch (e) {}

    return booking;
  }

  /**
   * Get user's own bookings
   */
  async getMyBookings(userId, query) {
    const { page, limit, skip } = getPagination(query);

    const filter = { user: userId };
    if (query.status) {
      filter.status = query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('trip', 'title origin destination startDate endDate price coverImage status')
      .populate('company', 'name logo averageRating reviewsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Booking.countDocuments(filter);

    return getPagingData(bookings, totalItems, page, limit, 'bookings');
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

    return booking;
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

    if (booking.status !== 'pending') {
      throw new ApiError(400, 'CANNOT_APPROVE_BOOKING');
    }

    booking.status = 'approved';
    booking.approvedAt = new Date();
    await booking.save();

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    try {
      const notificationService = require('./notification.service');
      const tripTitle = booking.tripSnapshot?.title || booking.trip?.title || '';
      await notificationService.createNotification({
        user: booking.user._id || booking.user,
        title: 'تمت الموافقة على الحجز!',
        body: `تهانينا! تمت الموافقة على حجزك لرحلة (${tripTitle}) بنجاح.`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: booking.trip?._id },
      });
    } catch (e) {}

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

    if (['rejected', 'cancelled'].includes(booking.status)) {
      throw new ApiError(400, 'CANNOT_REJECT_BOOKING');
    }

    // Restore seats to the trip
    const trip = await Trip.findById(booking.trip);
    if (trip) {
      trip.availableSeats += booking.numberOfSeats;
      await trip.save();
    }

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason || '';
    booking.rejectedAt = new Date();
    await booking.save();

    await booking.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'trip', select: 'title origin destination startDate endDate price coverImage status' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
    ]);

    try {
      const notificationService = require('./notification.service');
      const tripTitle = booking.tripSnapshot?.title || booking.trip?.title || '';
      await notificationService.createNotification({
        user: booking.user._id || booking.user,
        title: 'تم رفض الحجز',
        body: `نأسف، تم رفض طلب حجزك لرحلة (${tripTitle}).${rejectionReason ? ' السبب: ' + rejectionReason : ''}`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: booking.trip?._id },
      });
    } catch (e) {}

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

    if (['rejected', 'cancelled'].includes(booking.status)) {
      throw new ApiError(400, 'BOOKING_ALREADY_CANCELLED_OR_REJECTED');
    }

    // Restore seats to the trip
    const trip = await Trip.findById(booking.trip);
    if (trip) {
      trip.availableSeats += booking.numberOfSeats;
      await trip.save();
    }

    booking.status = 'cancelled';
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
