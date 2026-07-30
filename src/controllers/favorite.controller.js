const favoriteService = require('../services/favorite.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class FavoriteController {
  toggleFavorite = AsyncHandler(async (req, res) => {
    const result = await favoriteService.toggleFavorite(req.user, req.params.tripId);
    const messageKey = result.isFavorite ? 'FAVORITE_ADDED' : 'FAVORITE_REMOVED';
    res.status(200).json(new ApiResponse(200, messageKey, result, req.lang));
  });

  addFavorite = AsyncHandler(async (req, res) => {
    const favorite = await favoriteService.addFavorite(req.user, req.params.tripId);
    res.status(201).json(new ApiResponse(201, 'FAVORITE_ADDED', favorite, req.lang));
  });

  removeFavorite = AsyncHandler(async (req, res) => {
    await favoriteService.removeFavorite(req.user._id, req.params.tripId);
    res.status(200).json(new ApiResponse(200, 'FAVORITE_REMOVED', {}, req.lang));
  });

  getUserFavorites = AsyncHandler(async (req, res) => {
    const data = await favoriteService.getUserFavorites(req.user._id, req.query);
    res.status(200).json(new ApiResponse(200, 'FAVORITES_FETCHED', data, req.lang));
  });

  checkIsFavorite = AsyncHandler(async (req, res) => {
    const result = await favoriteService.checkIsFavorite(req.user._id, req.params.tripId);
    res.status(200).json(new ApiResponse(200, 'OPERATION_SUCCESS', result, req.lang));
  });
}

module.exports = new FavoriteController();
