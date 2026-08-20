const tripService = require('../services/trip.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class TripController {
  createTrip = AsyncHandler(async (req, res) => {
    const trip = await tripService.createTrip(req.body, req.files, req.user);
    res.status(201).json(new ApiResponse(201, 'TRIP_CREATED', trip, req.lang));
  });

  getAllTrips = AsyncHandler(async (req, res) => {
    const data = await tripService.getAllTrips(req.query, req.user);
    res.status(200).json(new ApiResponse(200, 'TRIPS_FETCHED', data, req.lang));
  });

  getFeaturedTrips = AsyncHandler(async (req, res) => {
    const trips = await tripService.getFeaturedTrips(req.query.limit, req.user);
    res.status(200).json(new ApiResponse(200, 'FEATURED_TRIPS_FETCHED', trips, req.lang));
  });

  getTripById = AsyncHandler(async (req, res) => {
    const trip = await tripService.getTripById(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'TRIP_FETCHED', trip, req.lang));
  });

  updateTrip = AsyncHandler(async (req, res) => {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.files, req.user);
    res.status(200).json(new ApiResponse(200, 'TRIP_UPDATED', trip, req.lang));
  });

  deleteTrip = AsyncHandler(async (req, res) => {
    await tripService.deleteTrip(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'TRIP_DELETED', {}, req.lang));
  });

  duplicateTrip = AsyncHandler(async (req, res) => {
    const trip = await tripService.duplicateTrip(req.params.id, req.user);
    res.status(201).json(new ApiResponse(201, 'TRIP_DUPLICATED_SUCCESSFULLY', trip, req.lang));
  });

  getTripPassengers = AsyncHandler(async (req, res) => {
    const manifest = await tripService.getTripPassengers(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'PASSENGER_LIST_FETCHED', manifest, req.lang));
  });

  sendTripAnnouncement = AsyncHandler(async (req, res) => {
    const result = await tripService.sendTripAnnouncement(req.params.id, req.user, req.body);
    res.status(200).json(new ApiResponse(200, 'ANNOUNCEMENT_SENT_SUCCESSFULLY', result, req.lang));
  });
}

module.exports = new TripController();
