const bookingService = require('../services/booking.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class BookingController {
  createBooking = AsyncHandler(async (req, res) => {
    const booking = await bookingService.createBooking(req.user._id, req.body, req.user);
    res.status(201).json(new ApiResponse(201, 'BOOKING_CREATED', booking, req.lang));
  });

  getMyBookings = AsyncHandler(async (req, res) => {
    const data = await bookingService.getMyBookings(req.user._id, req.query);
    res.status(200).json(new ApiResponse(200, 'BOOKINGS_FETCHED', data, req.lang));
  });

  getAllBookings = AsyncHandler(async (req, res) => {
    const data = await bookingService.getAllBookings(req.query, req.user);
    res.status(200).json(new ApiResponse(200, 'BOOKINGS_FETCHED', data, req.lang));
  });

  getBookingById = AsyncHandler(async (req, res) => {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user._id,
      req.user.role,
      req.user.company
    );
    res.status(200).json(new ApiResponse(200, 'BOOKING_FETCHED', booking, req.lang));
  });

  approveBooking = AsyncHandler(async (req, res) => {
    const booking = await bookingService.approveBooking(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'BOOKING_APPROVED', booking, req.lang));
  });

  rejectBooking = AsyncHandler(async (req, res) => {
    const booking = await bookingService.rejectBooking(req.params.id, req.body.rejectionReason, req.user);
    res.status(200).json(new ApiResponse(200, 'BOOKING_REJECTED', booking, req.lang));
  });

  cancelBooking = AsyncHandler(async (req, res) => {
    const isPrivileged = ['super_admin', 'admin', 'company_admin'].includes(req.user.role);
    const roleForCancellation = isPrivileged ? 'admin' : 'user';
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.body.cancellationReason,
      roleForCancellation
    );
    res.status(200).json(new ApiResponse(200, 'BOOKING_CANCELLED', booking, req.lang));
  });
}

module.exports = new BookingController();
