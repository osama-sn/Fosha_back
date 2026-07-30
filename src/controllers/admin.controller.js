const adminService = require('../services/admin.service');
const cleanupService = require('../services/cleanup.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');
const ApiError = require('../utils/ApiError');

class AdminController {
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

  cleanupDemoData = AsyncHandler(async (req, res) => {
    const hours = req.body.hours ? Number(req.body.hours) : 24;
    const summary = await cleanupService.cleanupOldDemoData(hours);
    res.status(200).json(new ApiResponse(200, 'DEMO_CLEANUP_SUCCESS', summary, req.lang));
  });
}

module.exports = new AdminController();
