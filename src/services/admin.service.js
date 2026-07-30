const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Company = require('../models/company.model');

class AdminService {
  /**
   * Get comprehensive Super Admin dashboard analytics stats
   */
  async getDashboardStats() {
    // 1. Companies stats
    const activeCompanies = await Company.countDocuments({ status: 'active', isDeleted: false });
    const pendingCompanies = await Company.countDocuments({ status: 'pending', isDeleted: false });
    const suspendedCompanies = await Company.countDocuments({ status: 'suspended', isDeleted: false });
    const totalCompanies = await Company.countDocuments({ isDeleted: false });

    // 2. Users count
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const totalCompanyAdmins = await User.countDocuments({ role: 'company_admin' });
    const totalSuperAdmins = await User.countDocuments({ role: { $in: ['super_admin', 'admin'] } });

    // 3. Trips stats
    const publishedTrips = await Trip.countDocuments({ status: 'published', isDeleted: false });
    const draftTrips = await Trip.countDocuments({ status: 'draft', isDeleted: false });
    const featuredTrips = await Trip.countDocuments({ isFeatured: true, isDeleted: false });
    const totalTrips = await Trip.countDocuments({ isDeleted: false });

    // 4. Bookings counts by status
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const totalBookings = await Booking.countDocuments();

    // 5. Total Financials & Revenue calculated from approved bookings
    const financialsAgg = await Booking.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          totalGrossRevenue: { $sum: '$totalPrice' },
          totalAdminCommissions: { $sum: '$adminCommissionAmount' },
          totalCompanyNetPayouts: { $sum: '$companyNetAmount' },
        },
      },
    ]);

    const totalGrossRevenue = financialsAgg.length > 0 ? financialsAgg[0].totalGrossRevenue : 0;
    const totalAdminCommissions = financialsAgg.length > 0 ? financialsAgg[0].totalAdminCommissions : 0;
    const totalCompanyNetPayouts = financialsAgg.length > 0 ? financialsAgg[0].totalCompanyNetPayouts : 0;

    // Monthly subscriptions estimated total
    const subscriptionFeeAgg = await Company.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, totalMonthlySubscriptions: { $sum: '$monthlySubscriptionFee' } } },
    ]);
    const totalMonthlySubscriptions = subscriptionFeeAgg.length > 0 ? subscriptionFeeAgg[0].totalMonthlySubscriptions : 0;

    // 6. Top 5 popular companies
    const topCompaniesAgg = await Booking.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$company',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalCommission: { $sum: '$adminCommissionAmount' },
        },
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyDetails',
        },
      },
      { $unwind: '$companyDetails' },
      {
        $project: {
          _id: '$companyDetails._id',
          name: '$companyDetails.name',
          logo: '$companyDetails.logo',
          averageRating: '$companyDetails.averageRating',
          reviewsCount: '$companyDetails.reviewsCount',
          totalBookings: 1,
          totalRevenue: 1,
          totalCommission: 1,
        },
      },
    ]);

    // 7. Top 5 popular trips
    const topTripsAgg = await Booking.aggregate([
      { $group: { _id: '$trip', bookingCount: { $sum: 1 }, totalSeatsBooked: { $sum: '$numberOfSeats' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'trips',
          localField: '_id',
          foreignField: '_id',
          as: 'tripDetails',
        },
      },
      { $unwind: '$tripDetails' },
      {
        $project: {
          _id: '$tripDetails._id',
          title: '$tripDetails.title',
          destination: '$tripDetails.destination',
          price: '$tripDetails.price',
          coverImage: '$tripDetails.coverImage',
          bookingCount: 1,
          totalSeatsBooked: 1,
        },
      },
    ]);

    return {
      companies: {
        totalCompanies,
        activeCompanies,
        pendingCompanies,
        suspendedCompanies,
      },
      users: {
        totalUsers,
        totalCompanyAdmins,
        totalSuperAdmins,
      },
      trips: {
        totalTrips,
        publishedTrips,
        draftTrips,
        featuredTrips,
      },
      bookings: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        cancelledBookings,
      },
      financials: {
        totalGrossRevenue,
        totalAdminCommissions,
        totalCompanyNetPayouts,
        totalMonthlySubscriptions,
      },
      topCompanies: topCompaniesAgg,
      topTrips: topTripsAgg,
    };
  }

  /**
   * Get analytics dashboard stats specifically for a single Company Admin
   */
  async getCompanyDashboardStats(companyId) {
    // 1. Company trips count
    const publishedTrips = await Trip.countDocuments({ company: companyId, status: 'published', isDeleted: false });
    const draftTrips = await Trip.countDocuments({ company: companyId, status: 'draft', isDeleted: false });
    const totalTrips = await Trip.countDocuments({ company: companyId, isDeleted: false });

    // 2. Company bookings count
    const pendingBookings = await Booking.countDocuments({ company: companyId, status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ company: companyId, status: 'approved' });
    const rejectedBookings = await Booking.countDocuments({ company: companyId, status: 'rejected' });
    const cancelledBookings = await Booking.countDocuments({ company: companyId, status: 'cancelled' });
    const totalBookings = await Booking.countDocuments({ company: companyId });

    // 3. Financials calculation
    const financialsAgg = await Booking.aggregate([
      { $match: { company: companyId, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalGrossRevenue: { $sum: '$totalPrice' },
          totalAdminCommissionPaid: { $sum: '$adminCommissionAmount' },
          totalCompanyNetRevenue: { $sum: '$companyNetAmount' },
        },
      },
    ]);

    const totalGrossRevenue = financialsAgg.length > 0 ? financialsAgg[0].totalGrossRevenue : 0;
    const totalAdminCommissionPaid = financialsAgg.length > 0 ? financialsAgg[0].totalAdminCommissionPaid : 0;
    const totalCompanyNetRevenue = financialsAgg.length > 0 ? financialsAgg[0].totalCompanyNetRevenue : 0;

    // 4. Top trips for this company
    const topTripsAgg = await Booking.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$trip', bookingCount: { $sum: 1 }, totalSeatsBooked: { $sum: '$numberOfSeats' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'trips',
          localField: '_id',
          foreignField: '_id',
          as: 'tripDetails',
        },
      },
      { $unwind: '$tripDetails' },
      {
        $project: {
          _id: '$tripDetails._id',
          title: '$tripDetails.title',
          destination: '$tripDetails.destination',
          price: '$tripDetails.price',
          coverImage: '$tripDetails.coverImage',
          bookingCount: 1,
          totalSeatsBooked: 1,
        },
      },
    ]);

    const companyInfo = await Company.findById(companyId).select(
      'name logo commissionType commissionValue monthlySubscriptionFee subscriptionStatus isFeatured averageRating reviewsCount'
    );

    return {
      company: companyInfo,
      trips: {
        totalTrips,
        publishedTrips,
        draftTrips,
      },
      bookings: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        cancelledBookings,
      },
      financials: {
        totalGrossRevenue,
        totalAdminCommissionPaid,
        totalCompanyNetRevenue,
      },
      topTrips: topTripsAgg,
    };
  }
}

module.exports = new AdminService();
