const mongoose = require('mongoose');
const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Company = require('../models/company.model');
const Settlement = require('../models/settlement.model');
const Expense = require('../models/expense.model');
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

    // Total expenses across companies
    const globalExpensesAgg = await Expense.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]);
    const totalExpenses = globalExpensesAgg.length > 0 ? globalExpensesAgg[0].totalExpenses : 0;

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
        totalExpenses,
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

    // Financials Aggregation (Bookings)
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

    // Expenses Aggregation
    const expensesAgg = await Expense.aggregate([
      { $match: { company: compObjId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ]);

    const totalExpenses = expensesAgg.length > 0 ? expensesAgg[0].totalExpenses : 0;
    const netProfit = totalCompanyNetPayouts - totalExpenses;

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
        companyNetRevenue: totalCompanyNetPayouts,
        totalExpenses,
        netProfit,
      },
      recentBookings,
    };
  }

  /**
   * Get customers who booked with the company
   */
  async getCompanyCustomers(companyId, { page = 1, limit = 10, search = '' } = {}) {
    const compObjId = typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId;
    const skip = (Number(page) - 1) * Number(limit);

    const customersAgg = await Booking.aggregate([
      { $match: { company: compObjId } },
      {
        $group: {
          _id: '$user',
          totalBookings: { $sum: 1 },
          approvedBookings: {
            $sum: { $cond: [{ $eq: ['$status', BookingStatus.APPROVED] }, 1, 0] },
          },
          totalSpent: {
            $sum: { $cond: [{ $eq: ['$status', BookingStatus.APPROVED] }, '$totalPrice', 0] },
          },
          lastBookingDate: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { 'userDetails.fullName': new RegExp(search, 'i') },
                  { 'userDetails.email': new RegExp(search, 'i') },
                  { 'userDetails.phone': new RegExp(search, 'i') },
                ],
              },
            },
          ]
        : []),
      { $sort: { lastBookingDate: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $project: {
                _id: '$userDetails._id',
                fullName: '$userDetails.fullName',
                email: '$userDetails.email',
                phone: '$userDetails.phone',
                profileImage: '$userDetails.profileImage',
                totalBookings: 1,
                approvedBookings: 1,
                totalSpent: 1,
                lastBookingDate: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = customersAgg[0]?.metadata[0]?.total || 0;
    const customers = customersAgg[0]?.data || [];

    const { getPagingData } = require('../utils/pagination.util');
    return getPagingData(customers, total, Number(page), Number(limit), 'customers');
  }

  /**
   * Get detailed financial report for a company
   */
  async getCompanyFinancialReport(companyId, query = {}) {
    const compObjId = typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId;
    const { startDate, endDate, tripId } = query;

    const bookingFilter = { company: compObjId, status: { $in: [BookingStatus.APPROVED, BookingStatus.PENDING] } };
    const expenseFilter = { company: compObjId, isDeleted: false };

    if (tripId) {
      const tripObjId = typeof tripId === 'string' ? new mongoose.Types.ObjectId(tripId) : tripId;
      bookingFilter.trip = tripObjId;
      expenseFilter.trip = tripObjId;
    }

    if (startDate || endDate) {
      bookingFilter.createdAt = {};
      expenseFilter.expenseDate = {};
      if (startDate) {
        bookingFilter.createdAt.$gte = new Date(startDate);
        expenseFilter.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        bookingFilter.createdAt.$lte = new Date(endDate);
        expenseFilter.expenseDate.$lte = new Date(endDate);
      }
    }

    const [financialsAgg, expensesAgg, categoryAgg, bookingsCountAgg] = await Promise.all([
      Booking.aggregate([
        { $match: bookingFilter },
        {
          $group: {
            _id: null,
            totalGrossRevenue: { $sum: '$totalPrice' },
            totalAdminCommissions: { $sum: '$adminCommissionAmount' },
            totalCompanyNetPayouts: { $sum: '$companyNetAmount' },
            totalBookingsCount: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: expenseFilter },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            expensesCount: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: expenseFilter },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { company: compObjId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalGrossRevenue = financialsAgg[0]?.totalGrossRevenue || 0;
    const totalAdminCommissions = financialsAgg[0]?.totalAdminCommissions || 0;
    const totalCompanyNetPayouts = financialsAgg[0]?.totalCompanyNetPayouts || 0;
    const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
    const netProfit = totalCompanyNetPayouts - totalExpenses;

    const company = await Company.findById(companyId).select('name logo status commissionType commissionValue');

    return {
      company,
      period: { startDate: startDate || null, endDate: endDate || null },
      financials: {
        totalGrossRevenue,
        totalAdminCommissions,
        totalCompanyNetPayouts,
        companyNetRevenue: totalCompanyNetPayouts,
        totalExpenses,
        netProfit,
      },
      expensesByCategory: categoryAgg.map((cat) => ({
        category: cat._id,
        totalAmount: cat.totalAmount,
        count: cat.count,
      })),
      bookingsByStatus: bookingsCountAgg.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Get monthly financial report for Super Admin
   */
  async getMonthlyFinancialReport({ month, year } = {}) {
    const now = new Date();
    const currentMonth = month ? Number(month) : now.getMonth() + 1;
    const currentYear = year ? Number(year) : now.getFullYear();

    const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);

    const [bookingsAgg, expensesAgg, subscriptionFeeAgg] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            status: BookingStatus.APPROVED,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalGrossSales: { $sum: '$totalPrice' },
            totalAdminCommissions: { $sum: '$adminCommissionAmount' },
            totalCompanyNetPayouts: { $sum: '$companyNetAmount' },
            totalBookings: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            isDeleted: false,
            expenseDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
          },
        },
      ]),
      Company.aggregate([
        { $match: { isDeleted: false, status: CompanyStatus.ACTIVE } },
        { $group: { _id: null, totalMonthlySubscriptions: { $sum: '$monthlySubscriptionFee' } } },
      ]),
    ]);

    const totalGrossSales = bookingsAgg[0]?.totalGrossSales || 0;
    const totalAdminCommissions = bookingsAgg[0]?.totalAdminCommissions || 0;
    const totalCompanyNetPayouts = bookingsAgg[0]?.totalCompanyNetPayouts || 0;
    const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
    const totalMonthlySubscriptions = subscriptionFeeAgg[0]?.totalMonthlySubscriptions || 0;
    const totalPlatformRevenue = totalAdminCommissions + totalMonthlySubscriptions;

    return {
      period: { month: currentMonth, year: currentYear },
      financials: {
        totalGrossSales,
        totalAdminCommissions,
        totalCompanyNetPayouts,
        totalExpenses,
        totalMonthlySubscriptions,
        totalPlatformRevenue,
      },
    };
  }

  /**
   * Get all companies monthly stats breakdown for Super Admin
   */
  async getAllCompaniesMonthlyStats({ month, year, page = 1, limit = 10, search = '' } = {}) {
    const now = new Date();
    const currentMonth = month ? Number(month) : now.getMonth() + 1;
    const currentYear = year ? Number(year) : now.getFullYear();

    const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);
    const companyFilter = { isDeleted: false };
    if (search) {
      companyFilter.name = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      Company.find(companyFilter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Company.countDocuments(companyFilter),
    ]);

    const companiesStats = await Promise.all(
      companies.map(async (comp) => {
        const [bookingsAgg, expensesAgg] = await Promise.all([
          Booking.aggregate([
            {
              $match: {
                company: comp._id,
                status: BookingStatus.APPROVED,
                createdAt: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                totalGrossSales: { $sum: '$totalPrice' },
                totalAdminCommissions: { $sum: '$adminCommissionAmount' },
                totalCompanyNetPayouts: { $sum: '$companyNetAmount' },
                totalBookings: { $sum: 1 },
              },
            },
          ]),
          Expense.aggregate([
            {
              $match: {
                company: comp._id,
                isDeleted: false,
                expenseDate: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                totalExpenses: { $sum: '$amount' },
              },
            },
          ]),
        ]);

        const grossSales = bookingsAgg[0]?.totalGrossSales || 0;
        const adminCommission = bookingsAgg[0]?.totalAdminCommissions || 0;
        const companyNetPayout = bookingsAgg[0]?.totalCompanyNetPayouts || 0;
        const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
        const netProfit = companyNetPayout - totalExpenses;

        return {
          company: {
            _id: comp._id,
            name: comp.name,
            logo: comp.logo,
            commissionType: comp.commissionType,
            commissionValue: comp.commissionValue,
          },
          grossSales,
          adminCommission,
          companyNetPayout,
          totalExpenses,
          netProfit,
        };
      })
    );

    const { getPagingData } = require('../utils/pagination.util');
    return {
      period: { month: currentMonth, year: currentYear },
      ...getPagingData(companiesStats, total, Number(page), Number(limit), 'companiesStats'),
    };
  }
}

module.exports = new AdminAnalyticsService();
