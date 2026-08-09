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

    // 4. Bookings counts by status & Bookings Today
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const totalBookings = await Booking.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const confirmedBookingsToday = await Booking.countDocuments({
      status: 'approved',
      createdAt: { $gte: startOfToday },
    });

    // 5. Total Financials & Revenue calculated from approved + pending bookings
    const financialsAgg = await Booking.aggregate([
      { $match: { status: { $in: ['approved', 'pending'] } } },
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

    // Monthly subscriptions total
    const subscriptionFeeAgg = await Company.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, totalMonthlySubscriptions: { $sum: '$monthlySubscriptionFee' } } },
    ]);
    const totalMonthlySubscriptions = subscriptionFeeAgg.length > 0 ? subscriptionFeeAgg[0].totalMonthlySubscriptions : 0;

    // 6. Top 5 popular companies
    const topCompaniesAgg = await Booking.aggregate([
      { $match: { status: { $in: ['approved', 'pending'] } } },
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

    // 7. Top 5 popular trips (Includes Company Details for Dashboard Table)
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

    // 8. Recent 5 Booking Requests
    const recentBookings = await Booking.find()
      .populate('user', 'fullName email phone')
      .populate('trip', 'title coverImage price origin destination')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .limit(5);

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
        confirmedBookingsToday,
      },
      financials: {
        totalGrossRevenue,
        totalAdminCommissions,
        totalCompanyNetPayouts,
        totalMonthlySubscriptions,
      },
      topCompanies: topCompaniesAgg,
      topTrips: topTripsAgg,
      recentBookings,
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

  /**
   * Super Admin Monthly Financial & Revenue Breakdown Report
   */
  async getMonthlyFinancialReport({ month, year }) {
    const { getMonthDateRange } = require('../utils/analytics.util');
    const period = getMonthDateRange(month, year);
    const { startDate, endDate } = period;

    // 1. Subscription Earnings from Active Companies in this month
    const subscriptionAgg = await Company.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, totalSubscriptions: { $sum: '$monthlySubscriptionFee' } } },
    ]);
    const subscriptionsRevenue = subscriptionAgg.length > 0 ? subscriptionAgg[0].totalSubscriptions : 0;

    // 2. Booking Earnings (Platform Commission) created in this month (Approved + Pending)
    const bookingsAgg = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'pending'] },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          totalGrossSales: { $sum: '$totalPrice' },
          totalCommissions: { $sum: '$adminCommissionAmount' },
          totalCompanyNet: { $sum: '$companyNetAmount' },
          count: { $sum: 1 },
          totalSeats: { $sum: '$numberOfSeats' },
        },
      },
    ]);

    let approvedSales = 0, approvedCommissions = 0, approvedCompanyNet = 0, approvedCount = 0, approvedSeats = 0;
    let pendingSales = 0, pendingCommissions = 0, pendingCompanyNet = 0, pendingCount = 0, pendingSeats = 0;

    bookingsAgg.forEach((group) => {
      if (group._id === 'approved') {
        approvedSales = group.totalGrossSales;
        approvedCommissions = group.totalCommissions;
        approvedCompanyNet = group.totalCompanyNet;
        approvedCount = group.count;
        approvedSeats = group.totalSeats;
      } else if (group._id === 'pending') {
        pendingSales = group.totalGrossSales;
        pendingCommissions = group.totalCommissions;
        pendingCompanyNet = group.totalCompanyNet;
        pendingCount = group.count;
        pendingSeats = group.totalSeats;
      }
    });

    const totalGrossSales = approvedSales + pendingSales;
    const totalBookingCommissions = approvedCommissions + pendingCommissions;
    const totalCompanyNetPayouts = approvedCompanyNet + pendingCompanyNet;

    // Total Platform Earnings = Subscriptions + Booking Commissions
    const totalPlatformRevenue = subscriptionsRevenue + totalBookingCommissions;

    return {
      period: {
        month: period.month,
        year: period.year,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      superAdminNetProfit: {
        subscriptionEarnings: subscriptionsRevenue,
        bookingCommissionsEarnings: totalBookingCommissions,
        approvedCommissionsOnly: approvedCommissions,
        pendingCommissionsExpected: pendingCommissions,
        totalNetProfit: totalPlatformRevenue,
      },
      financialSummary: {
        subscriptionsRevenue,
        bookingCommissionsRevenue: totalBookingCommissions,
        totalPlatformRevenue,
        totalGrossSales,
        totalCompanyNetPayouts,
      },
      volumeSummary: {
        approvedBookingsCount: approvedCount,
        pendingBookingsCount: pendingCount,
        totalBookingsCount: approvedCount + pendingCount,
        totalSeatsBooked: approvedSeats + pendingSeats,
      },
    };
  }

  /**
   * Super Admin per-company monthly stats (trips created, approved/pending bookings, gross sales, admin commission, company net payout "خد كام")
   */
  async getAllCompaniesMonthlyStats({ month, year, page = 1, limit = 10, search = '' }) {
    const { getMonthDateRange } = require('../utils/analytics.util');
    const period = getMonthDateRange(month, year);
    const { startDate, endDate } = period;

    const filter = { isDeleted: false };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { contactEmail: searchRegex },
        { contactPhone: searchRegex },
        { address: searchRegex },
        { governorate: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('owner', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Company.countDocuments(filter),
    ]);

    const companiesMonthlyStats = await Promise.all(
      companies.map(async (company) => {
        const compObj = company.toObject();

        // 1. Trips created by company in this date range
        const monthlyTripsCount = await Trip.countDocuments({
          company: company._id,
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: endDate },
        });

        // 2. Bookings analytics for this company in this date range (Approved + Pending)
        const bookingsAgg = await Booking.aggregate([
          {
            $match: {
              company: company._id,
              status: { $in: ['approved', 'pending'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              monthlyBookingsCount: { $sum: 1 },
              monthlySeatsBooked: { $sum: '$numberOfSeats' },
              monthlyGrossSales: { $sum: '$totalPrice' },
              monthlyAdminCommission: { $sum: '$adminCommissionAmount' },
              monthlyCompanyNet: { $sum: '$companyNetAmount' },
            },
          },
        ]);

        const stats = bookingsAgg.length > 0 ? bookingsAgg[0] : {};

        compObj.monthlyStats = {
          month: period.month,
          year: period.year,
          monthlyTripsCount,
          monthlyBookingsCount: stats.monthlyBookingsCount || 0,
          monthlySeatsBooked: stats.monthlySeatsBooked || 0,
          monthlyGrossSales: stats.monthlyGrossSales || 0,
          monthlyAdminCommission: stats.monthlyAdminCommission || 0,
          monthlyCompanyNet: stats.monthlyCompanyNet || 0,
        };

        return compObj;
      })
    );

    const { getPagingData } = require('../utils/pagination.util');
    return {
      period: {
        month: period.month,
        year: period.year,
      },
      ...getPagingData(companiesMonthlyStats, total, Number(page), Number(limit), 'companies'),
    };
  }
}

module.exports = new AdminService();
