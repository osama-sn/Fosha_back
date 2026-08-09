const express = require('express');
const tripController = require('../controllers/trip.controller');
const reviewController = require('../controllers/review.controller');
const { protect, optionalProtect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { uploadTripImages } = require('../middlewares/tripUploadMiddleware');
const {
  createTripValidator,
  updateTripValidator,
} = require('../validators/trip.validator');
const { createReviewValidator } = require('../validators/review.validator');

const router = express.Router();

// Public / Optional Auth Routes
router.get('/', optionalProtect, tripController.getAllTrips);
router.get('/featured', tripController.getFeaturedTrips);
router.get('/:id', optionalProtect, tripController.getTripById);

// Review Public Route
router.get('/:id/reviews', reviewController.getTripReviews);

// User Protected Review Route
router.post('/:id/reviews', protect, createReviewValidator, validate, reviewController.createReview);

// Company Admin & Super Admin Trip Management Routes
router.post(
  '/',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  uploadTripImages,
  createTripValidator,
  validate,
  tripController.createTrip
);

router.put(
  '/:id',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  uploadTripImages,
  updateTripValidator,
  validate,
  tripController.updateTrip
);

router.patch(
  '/:id',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  uploadTripImages,
  updateTripValidator,
  validate,
  tripController.updateTrip
);

router.delete(
  '/:id',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  tripController.deleteTrip
);

module.exports = router;
