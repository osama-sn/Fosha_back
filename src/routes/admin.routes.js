const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

// ==================== DASHBOARD STATS & REPORTS ====================

// Super Admin Global Dashboard Stats
router.get(
  '/stats',
  authorize('super_admin', 'admin'),
  adminController.getDashboardStats
);

// Company Admin Dashboard Stats
router.get(
  '/company-stats',
  authorize('company_admin', 'super_admin', 'admin'),
  adminController.getCompanyDashboardStats
);

// Company Customers List
router.get(
  '/company-customers',
  authorize('company_admin', 'super_admin', 'admin'),
  adminController.getCompanyCustomers
);

// Company Financial & Profit Report
router.get(
  '/company-financial-report',
  authorize('company_admin', 'super_admin', 'admin'),
  adminController.getCompanyFinancialReport
);

// Super Admin Monthly Financial Revenue Breakdown Report
router.get(
  '/monthly-reports',
  authorize('super_admin', 'admin'),
  adminController.getMonthlyFinancialReport
);

// Super Admin Per-Company Monthly Analytics
router.get(
  '/company-monthly-stats',
  authorize('super_admin', 'admin'),
  adminController.getAllCompaniesMonthlyStats
);

// ==================== USER MANAGEMENT ====================

// View all users
router.get(
  '/users',
  authorize('super_admin', 'admin'),
  adminController.getUsers
);

// View single user details with stats & bookings
router.get(
  '/users/:id',
  authorize('super_admin', 'admin'),
  adminController.getUserById
);

// Block user
router.patch(
  '/users/:id/block',
  authorize('super_admin', 'admin'),
  adminController.blockUser
);

// Unblock user
router.patch(
  '/users/:id/unblock',
  authorize('super_admin', 'admin'),
  adminController.unblockUser
);

// ==================== REVIEWS CONTROL ====================

// View all trip & company reviews
router.get(
  '/reviews',
  authorize('super_admin', 'admin'),
  adminController.getAllReviews
);

// Hide / Unhide violating review
router.patch(
  '/reviews/:id/hide',
  authorize('super_admin', 'admin'),
  adminController.toggleReviewVisibility
);

// ==================== TRIPS & BOOKINGS CONTROL ====================

// Update trip status / visibility
router.patch(
  '/trips/:id/status',
  authorize('super_admin', 'admin'),
  adminController.updateTripStatus
);

// Update booking payment status
router.patch(
  '/bookings/:id/payment-status',
  authorize('super_admin', 'admin'),
  adminController.updateBookingPaymentStatus
);

// ==================== COMMISSIONS & MONTHLY SETTLEMENTS ====================

// Get monthly settlements
router.get(
  '/settlements',
  authorize('super_admin', 'admin'),
  adminController.getMonthlySettlements
);

// Record settlement payment
router.post(
  '/settlements/pay',
  authorize('super_admin', 'admin'),
  adminController.recordSettlementPayment
);

// ==================== SYSTEM CLEANUP ====================

// Demo Auto-Cleanup
router.post(
  '/cleanup-demo-data',
  authorize('super_admin', 'admin'),
  adminController.cleanupDemoData
);

module.exports = router;
