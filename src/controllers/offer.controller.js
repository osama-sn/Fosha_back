const offerService = require('../services/offer.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class OfferController {
  createOffer = AsyncHandler(async (req, res) => {
    const imagePath = req.file ? `/uploads/offers/${req.file.filename}` : null;
    const offer = await offerService.createOffer(req.body, imagePath, req.user);
    res.status(201).json(new ApiResponse(201, 'OFFER_CREATED', offer, req.lang));
  });

  getAllOffers = AsyncHandler(async (req, res) => {
    const offers = await offerService.getAllOffers(req.query, req.user);
    res.status(200).json(new ApiResponse(200, 'OFFERS_FETCHED', offers, req.lang));
  });

  getOfferById = AsyncHandler(async (req, res) => {
    const offer = await offerService.getOfferById(req.params.id);
    res.status(200).json(new ApiResponse(200, 'OFFER_FETCHED', offer, req.lang));
  });

  updateOffer = AsyncHandler(async (req, res) => {
    const imagePath = req.file ? `/uploads/offers/${req.file.filename}` : null;
    const offer = await offerService.updateOffer(req.params.id, req.body, imagePath, req.user);
    res.status(200).json(new ApiResponse(200, 'OFFER_UPDATED', offer, req.lang));
  });

  deleteOffer = AsyncHandler(async (req, res) => {
    await offerService.deleteOffer(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'OFFER_DELETED', {}, req.lang));
  });
}

module.exports = new OfferController();
