const express = require('express');
const offerController = require('../controllers/offer.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { uploadOfferImage } = require('../middlewares/offerUploadMiddleware');
const {
  createOfferValidator,
  updateOfferValidator,
} = require('../validators/offer.validator');

const router = express.Router();

// Public Routes (for Client Home Screen)
router.get('/', offerController.getAllOffers);
router.get('/:id', offerController.getOfferById);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), offerController.getAllOffers);
router.post('/', protect, authorize('admin'), uploadOfferImage, createOfferValidator, validate, offerController.createOffer);
router.put('/:id', protect, authorize('admin'), uploadOfferImage, updateOfferValidator, validate, offerController.updateOffer);
router.delete('/:id', protect, authorize('admin'), offerController.deleteOffer);

module.exports = router;
