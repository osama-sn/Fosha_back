const reviewService = require('../services/review.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class ReviewController {
  createReview = AsyncHandler(async (req, res) => {
    const review = await reviewService.createReview(req.user._id, req.params.id, req.body, req.user);
    res.status(201).json(new ApiResponse(201, 'REVIEW_ADDED', review, req.lang));
  });

  getTripReviews = AsyncHandler(async (req, res) => {
    const data = await reviewService.getTripReviews(req.params.id, req.query);
    res.status(200).json(new ApiResponse(200, 'REVIEWS_FETCHED', data, req.lang));
  });
}

module.exports = new ReviewController();
