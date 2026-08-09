const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

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

// Demo Auto-Cleanup
router.post(
  '/cleanup-demo-data',
  authorize('super_admin', 'admin'),
  adminController.cleanupDemoData
);

module.exports = router;
