const Favorite = require('../models/favorite.model');
const Trip = require('../models/trip.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');

class FavoriteService {
  /**
   * Toggle favorite status (Add if absent, Remove if present)
   */
  async toggleFavorite(userObj, tripId) {
    const userId = userObj?._id || userObj;
    const isProtected = Boolean(userObj?.isProtected || userObj?.role === 'admin');

    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    const existingFavorite = await Favorite.findOne({ user: userId, trip: tripId });

    if (existingFavorite) {
      await Favorite.deleteOne({ _id: existingFavorite._id });
      return { isFavorite: false, action: 'removed' };
    } else {
      await Favorite.create({ user: userId, trip: tripId, isProtected });
      return { isFavorite: true, action: 'added' };
    }
  }

  /**
   * Add trip to favorites
   */
  async addFavorite(userObj, tripId) {
    const userId = userObj?._id || userObj;
    const isProtected = Boolean(userObj?.isProtected || userObj?.role === 'admin');

    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    const existingFavorite = await Favorite.findOne({ user: userId, trip: tripId });
    if (existingFavorite) {
      throw new ApiError(400, 'FAVORITE_ALREADY_EXISTS');
    }

    const favorite = await Favorite.create({ user: userId, trip: tripId, isProtected });
    await favorite.populate('trip');
    return favorite;
  }

  /**
   * Remove trip from favorites
   */
  async removeFavorite(userId, tripId) {
    const favorite = await Favorite.findOneAndDelete({ user: userId, trip: tripId });
    if (!favorite) {
      throw new ApiError(404, 'FAVORITE_NOT_FOUND');
    }
    return true;
  }

  /**
   * Get user's favorite trips with pagination
   */
  async getUserFavorites(userId, query) {
    const { page, limit, skip } = getPagination(query);

    const filter = { user: userId };
    const favorites = await Favorite.find(filter)
      .populate({
        path: 'trip',
        match: { isDeleted: false, status: 'published' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out any null trips (e.g. if trip was soft-deleted or unpublished)
    const validFavorites = favorites.filter((f) => f.trip !== null);
    const totalItems = await Favorite.countDocuments(filter);

    return getPagingData(validFavorites, totalItems, page, limit, 'favorites');
  }

  /**
   * Check if a trip is favorited by the user
   */
  async checkIsFavorite(userId, tripId) {
    const favorite = await Favorite.findOne({ user: userId, trip: tripId });
    return { isFavorite: !!favorite };
  }
}

module.exports = new FavoriteService();
