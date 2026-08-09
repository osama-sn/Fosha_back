const tripService = require('../services/trip.service');
const companyService = require('../services/company.service');
const Category = require('../models/category.model');
const Offer = require('../models/offer.model');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class HomeController {
  /**
   * GET /api/v1/home
   * Consolidated Home Page API returning featured trips, governorate trips, featured companies, categories & offers.
   */
  getHomeData = AsyncHandler(async (req, res) => {
    const userGovernorate = (req.user && req.user.governorate)
      ? req.user.governorate
      : (req.query.governorate || '');

    const [featuredTrips, governorateTripsData, featuredCompaniesData, categories, offers] = await Promise.all([
      tripService.getFeaturedTrips(10),
      userGovernorate
        ? tripService.getAllTrips({ governorate: userGovernorate, limit: 10 }, req.user)
        : Promise.resolve({ trips: [] }),
      companyService.getCompanies({ isFeatured: 'true', limit: 10 }),
      Category.find().sort({ createdAt: -1 }),
      Offer.find({ isActive: true }).sort({ createdAt: -1 }),
    ]);

    const homeData = {
      userGovernorate,
      featuredTrips,
      governorateTrips: governorateTripsData.trips || [],
      featuredCompanies: featuredCompaniesData.companies || [],
      categories,
      offers,
    };

    res.status(200).json(new ApiResponse(200, 'HOME_DATA_FETCHED', homeData, req.lang));
  });
}

module.exports = new HomeController();
