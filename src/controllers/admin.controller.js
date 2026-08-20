const adminService = require('../services/admin.service');
const cleanupService = require('../services/cleanup.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');
const ApiError = require('../utils/ApiError');

class AdminController {
  // ==================== DASHBOARD & REPORTS ====================

  getDashboardStats = AsyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(new ApiResponse(200, 'STATS_FETCHED', stats, req.lang));
  });

  getCompanyDashboardStats = AsyncHandler(async (req, res) => {
    const companyId = req.user.company ? (req.user.company._id || req.user.company) : req.params.companyId;
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const stats = await adminService.getCompanyDashboardStats(companyId);
    res.status(200).json(new ApiResponse(200, 'COMPANY_STATS_FETCHED', stats, req.lang));
  });

  getCompanyCustomers = AsyncHandler(async (req, res) => {
    const companyId = req.user.role === 'company_admin'
      ? (req.user.company ? (req.user.company._id || req.user.company) : null)
      : (req.query.companyId || (req.user.company ? (req.user.company._id || req.user.company) : null));

    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const result = await adminService.getCompanyCustomers(companyId, req.query);
    res.status(200).json(new ApiResponse(200, 'COMPANY_CUSTOMERS_FETCHED', result, req.lang));
  });

  getCompanyFinancialReport = AsyncHandler(async (req, res) => {
    const companyId = req.user.role === 'company_admin'
      ? (req.user.company ? (req.user.company._id || req.user.company) : null)
      : (req.query.companyId || (req.user.company ? (req.user.company._id || req.user.company) : null));

    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const report = await adminService.getCompanyFinancialReport(companyId, req.query);
    res.status(200).json(new ApiResponse(200, 'COMPANY_FINANCIAL_REPORT_FETCHED', report, req.lang));
  });

  getMonthlyFinancialReport = AsyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const report = await adminService.getMonthlyFinancialReport({ month, year });
    res.status(200).json(new ApiResponse(200, 'MONTHLY_REPORT_FETCHED', report, req.lang));
  });

  getAllCompaniesMonthlyStats = AsyncHandler(async (req, res) => {
    const { month, year, page, limit, search } = req.query;
    const stats = await adminService.getAllCompaniesMonthlyStats({ month, year, page, limit, search });
    res.status(200).json(new ApiResponse(200, 'COMPANY_MONTHLY_STATS_FETCHED', stats, req.lang));
  });

  cleanupDemoData = AsyncHandler(async (req, res) => {
    const hours = req.body.hours ? Number(req.body.hours) : 24;
    const summary = await cleanupService.cleanupOldDemoData(hours);
    res.status(200).json(new ApiResponse(200, 'DEMO_CLEANUP_SUCCESS', summary, req.lang));
  });

  // ==================== USERS MANAGEMENT ====================

  getUsers = AsyncHandler(async (req, res) => {
    const { page, limit, search, role, isBlocked } = req.query;
    const result = await adminService.getUsers({ page, limit, search, role, isBlocked });
    res.status(200).json(new ApiResponse(200, 'USERS_FETCHED', result, req.lang));
  });

  getUserById = AsyncHandler(async (req, res) => {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json(new ApiResponse(200, 'USER_FETCHED', user, req.lang));
  });

  blockUser = AsyncHandler(async (req, res) => {
    const user = await adminService.blockUser(req.params.id, req.body, req.user);
    res.status(200).json(new ApiResponse(200, 'USER_BLOCKED_SUCCESS', user, req.lang));
  });

  unblockUser = AsyncHandler(async (req, res) => {
    const user = await adminService.unblockUser(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, 'USER_UNBLOCKED_SUCCESS', user, req.lang));
  });

  // ==================== REVIEWS CONTROL ====================

  getAllReviews = AsyncHandler(async (req, res) => {
    const { page, limit, type, search, isHidden } = req.query;
    const reviews = await adminService.getAllReviews({ page, limit, type, search, isHidden });
    res.status(200).json(new ApiResponse(200, 'REVIEWS_FETCHED', reviews, req.lang));
  });

  toggleReviewVisibility = AsyncHandler(async (req, res) => {
    const review = await adminService.toggleReviewVisibility(req.params.id, req.body, req.user);
    res.status(200).json(new ApiResponse(200, 'REVIEW_VISIBILITY_UPDATED', review, req.lang));
  });

  // ==================== TRIPS & BOOKINGS CONTROL ====================

  updateTripStatus = AsyncHandler(async (req, res) => {
    const trip = await adminService.updateTripStatus(req.params.id, req.body, req.user);
    res.status(200).json(new ApiResponse(200, 'TRIP_STATUS_UPDATED', trip, req.lang));
  });

  updateBookingPaymentStatus = AsyncHandler(async (req, res) => {
    const booking = await adminService.updateBookingPaymentStatus(req.params.id, req.body, req.user);
    res.status(200).json(new ApiResponse(200, 'BOOKING_PAYMENT_STATUS_UPDATED', booking, req.lang));
  });

  // ==================== COMMISSIONS & SETTLEMENTS ====================

  getMonthlySettlements = AsyncHandler(async (req, res) => {
    const { month, year, search, page, limit } = req.query;
    const settlements = await adminService.getMonthlySettlements({ month, year, search, page, limit });
    res.status(200).json(new ApiResponse(200, 'SETTLEMENTS_FETCHED', settlements, req.lang));
  });

  recordSettlementPayment = AsyncHandler(async (req, res) => {
    const settlement = await adminService.recordSettlementPayment(req.body, req.user);
    res.status(200).json(new ApiResponse(200, 'SETTLEMENT_PAYMENT_RECORDED', settlement, req.lang));
  });
}

module.exports = new AdminController();
