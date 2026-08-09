const express = require('express');
const { protect, optionalProtect, authorize } = require('../middlewares/authMiddleware');
const companyController = require('../controllers/company.controller');

const router = express.Router();

// Public routes
router.get('/', optionalProtect, companyController.getCompanies);
router.get('/:id', companyController.getCompanyById);
router.get('/:id/reviews', companyController.getCompanyReviews);

// Protected routes (User reviews)
router.post(
  '/:id/reviews',
  protect,
  companyController.addCompanyReview
);

// Protected routes (Super Admin creation & deletion)
router.post(
  '/',
  protect,
  authorize('super_admin', 'admin'),
  companyController.createCompany
);

router.delete(
  '/:id',
  protect,
  authorize('super_admin', 'admin'),
  companyController.deleteCompany
);

// Protected routes (Company Admin or Super Admin update)
router.patch(
  '/:id',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  companyController.updateCompany
);

router.put(
  '/:id',
  protect,
  authorize('super_admin', 'admin', 'company_admin'),
  companyController.updateCompany
);

module.exports = router;
