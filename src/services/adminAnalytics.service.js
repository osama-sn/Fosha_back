const mongoose = require('mongoose');
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Company = require('../models/company.model');
const Settlement = require('../models/settlement.model');
const activityService = require('./activity.service');
const { getMonthDateRange } = require('../utils/analytics.util');
const { BookingStatus, CompanyStatus, TripStatus, UserRole } = require('../constants/enums');

class AdminAnalyticsService {
  /**
   * Get comprehensive Super Admin dashboard analytics stats
   */
  async getDashboardStats() {
    // 1. Companies stats
    const activeCompanies = await Company.countDocuments({ status: CompanyStatus.ACTIVE, isDeleted: false });
    const pendingCompanies = await Company.countDocuments({ status: CompanyStatus.PENDING, isDeleted: false });
    const suspendedCompanies = await Company.countDocuments({ status: CompanyStatus.SUSPENDED, isDeleted: false });
    const totalCompanies = await Company.countDocuments({ isDeleted: false });

    // 2. Users count
    const totalUsers = await User.countDocuments({ role: UserRole.USER, isDeleted: { $ne: true } });
    const totalCompanyAdmins = await User.countDocuments({ role: UserRole.COMPANY_ADMIN, isDeleted: { $ne: true } });
    const totalSuperAdmins = await User.countDocuments({ role: { $in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }, isDeleted: { $ne: true } });
    const allUsersCount = await User.countDocuments({ isDeleted: { $ne: true } });

    // 3. Trips stats
    const publishedTrips = await Trip.countDocuments({ status: TripStatus.PUBLISHED, isDeleted: false });
    const activeTrips = publishedTrips;
    const draftTrips = await Trip.countDocuments({ status: TripStatus.DRAFT, isDeleted: false });
    const hiddenTrips = await Trip.countDocuments({ $or: [{ status: TripStatus.HIDDEN }, { isHidden: true }], isDeleted: false });
    const featuredTrips = await Trip.countDocuments({ isFeatured: true, isDeleted: false });
    const totalTrips = await Trip.countDocuments({ isDeleted: false });

    // 4. Bookings counts by status & Bookings Today
    const pendingBookings = await Booking.countDocuments({ status: BookingStatus.PENDING });
    const approvedBookings = await Booking.countDocuments({ status: BookingStatus.APPROVED });
    const rejectedBookings = await Booking.countDocuments({ status: BookingStatus.REJECTED });
    const cancelledBookings = await Booking.countDocuments({ status: BookingStatus.CANCELLED });
    const totalBookings = await Booking.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const confirmedBookingsToday = await Booking.countDocuments({
      status: BookingStatus.APPROVED,
      createdAt: { $gte: startOfToday },
    });

    // 5. Total Financials (GMV, Commissions, Net Payouts)
    const financialsAgg = await Booking.aggregate([
      { $match: { status: { $in: [BookingStatus.APPROVED, BookingStatus.PENDING] } } },
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

    // Settlement payment aggregations
    const settlementsAgg = await Settlement.aggregate([
      {
        $group: {
          _id: null,
          totalCollectedCommissions: { $sum: '$paidAmount' },
        },
      },
    ]);

    const collectedCommissions = settlementsAgg.length > 0 ? settlementsAgg[0].totalCollectedCommissions : 0;
    const remainingCommissions = Math.max(0, totalAdminCommissions - collectedCommissions);

    // Monthly subscriptions total
    const subscriptionFeeAgg = await Company.aggregate([
      { $match: { isDeleted: false, status: CompanyStatus.ACTIVE } },
      { $group: { _id: null, totalMonthlySubscriptions: { $sum: '$monthlySubscriptionFee' } } },
    ]);
    const totalMonthlySubscriptions = subscriptionFeeAgg.length > 0 ? subscriptionFeeAgg[0].totalMonthlySubscriptions : 0;

    // 6. Top 5 popular companies
    const topCompaniesAgg = await Booking.aggregate([
      { $match: { status: { $in: [BookingStatus.APPROVED, BookingStatus.PENDING] } } },
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
      { $group: { _id: '$trip', bookingCount: { $sum: 1 }, totalSeatsBooked: { $sum: '$numberOfSeats' }, totalRevenue: { $sum: '$totalPrice' } } },
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
        $lookup: {
          from: 'companies',
          localField: 'tripDetails.company',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$tripDetails._id',
          title: '$tripDetails.title',
          destination: '$tripDetails.destination',
          price: '$tripDetails.price',
          coverImage: '$tripDetails.coverImage',
          bookingCount: 1,
          totalSeatsBooked: 1,
          totalRevenue: 1,
          company: {
            _id: '$company._id',
            name: '$company.name',
            logo: '$company.logo',
          },
        },
      },
    ]);

    // 8. Recent Bookings
    const recentBookings = await Booking.find()
      .populate('user', 'fullName email phone')
      .populate('trip', 'title coverImage price origin destination')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .limit(5);

    // 9. Recent System Activities Log
    const recentActivities = await activityService.getRecentActivities({ limit: 5 });

    return {
      companies: {
        totalCompanies,
        activeCompanies,
        pendingCompanies,
        suspendedCompanies,
      },
      users: {
        totalUsers: allUsersCount,
        regularUsers: totalUsers,
        totalCompanyAdmins,
        totalSuperAdmins,
      },
      trips: {
        totalTrips,
        publishedTrips,
        activeTrips,
        draftTrips,
        hiddenTrips,
        featuredTrips,
      },
      bookings: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        cancelledBookings,
        confirmedBookingsToday,
      },
      financials: {
        totalGrossRevenue,
        totalAdminCommissions,
        collectedCommissions,
        remainingCommissions,
        totalCompanyNetPayouts,
        totalMonthlySubscriptions,
      },
      topCompanies: topCompaniesAgg,
      topTrips: topTripsAgg,
      recentBookings,
      recentActivities,
    };
  }

  /**
   * Get analytics dashboard stats specifically for a single Company Admin
   */
  async getCompanyDashboardStats(companyId) {
    const compObjId = typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId;

    const publishedTrips = await Trip.countDocuments({ company: companyId, status: TripStatus.PUBLISHED, isDeleted: false });
    const draftTrips = await Trip.countDocuments({ company: companyId, status: TripStatus.DRAFT, isDeleted: false });
    const totalTrips = await Trip.countDocuments({ company: companyId, isDeleted: false });
    const upcomingTripsCount = await Trip.countDocuments({
      company: companyId,
      status: TripStatus.PUBLISHED,
      startDate: { $gte: new Date() },
      isDeleted: false,
    });

    const pendingBookings = await Booking.countDocuments({ company: companyId, status: BookingStatus.PENDING });
    const approvedBookings = await Booking.countDocuments({ company: companyId, status: BookingStatus.APPROVED });
    const rejectedBookings = await Booking.countDocuments({ company: companyId, status: BookingStatus.REJECTED });
    const cancelledBookings = await Booking.countDocuments({ company: companyId, status: BookingStatus.CANCELLED });
    const totalBookings = await Booking.countDocuments({ company: companyId });

    // Distinct Customers Count
    const uniqueCustomers = await Booking.find({ company: companyId }).distinct('user');
    const customersCount = uniqueCustomers.length;

    // Financials Aggregation
    const financialsAgg = await Booking.aggregate([
      { $match: { company: compObjId, status: { $in: [BookingStatus.APPROVED, BookingStatus.PENDING] } } },
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

    // Recent Bookings
    const recentBookings = await Booking.find({ company: companyId })
      .populate('user', 'fullName email phone profileImage')
      .populate('trip', 'title coverImage price startDate endDate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Company info
    const company = await Company.findById(companyId).select('name logo averageRating reviewsCount status commissionType commissionValue');

    return {
      company,
      trips: {
        totalTrips,
        publishedTrips,
        draftTrips,
        upcomingTripsCount,
      },
      bookings: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        cancelledBookings,
      },
      customers: {
        customersCount,
      },
      financials: {
        totalGrossRevenue,
        totalAdminCommissions,
        totalCompanyNetPayouts,
      },
      recentBookings,
    };
  }
}

module.exports = new AdminAnalyticsService();
