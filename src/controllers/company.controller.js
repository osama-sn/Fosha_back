const AsyncHandler = require('../utils/AsyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const companyService = require('../services/company.service');

const createCompany = AsyncHandler(async (req, res) => {
  const result = await companyService.createCompany(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, 'COMPANY_CREATED_SUCCESSFULLY', result, req.lang));
});

const getCompanies = AsyncHandler(async (req, res) => {
  const result = await companyService.getCompanies(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'OPERATION_SUCCESS', result, req.lang));
});

const getCompanyById = AsyncHandler(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, 'OPERATION_SUCCESS', company, req.lang));
});

const updateCompany = AsyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(req.params.id, req.body, req.user, req.files);
  res
    .status(200)
    .json(new ApiResponse(200, 'COMPANY_UPDATED_SUCCESSFULLY', company, req.lang));
});

const deleteCompany = AsyncHandler(async (req, res) => {
  await companyService.deleteCompany(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, 'COMPANY_DELETED_SUCCESSFULLY', {}, req.lang));
});

const addCompanyReview = AsyncHandler(async (req, res) => {
  const review = await companyService.addCompanyReview(
    req.params.id,
    req.user._id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, 'REVIEW_ADDED_SUCCESSFULLY', review, req.lang));
});

const getCompanyReviews = AsyncHandler(async (req, res) => {
  const result = await companyService.getCompanyReviews(req.params.id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'OPERATION_SUCCESS', result, req.lang));
});

const getCompanyPaymentAccounts = AsyncHandler(async (req, res) => {
  const accounts = await companyService.getPaymentAccounts(req.params.id, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'PAYMENT_ACCOUNTS_FETCHED', accounts, req.lang));
});

const addCompanyPaymentAccount = AsyncHandler(async (req, res) => {
  const accounts = await companyService.addPaymentAccount(req.params.id, req.user, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, 'PAYMENT_ACCOUNT_ADDED', accounts, req.lang));
});

const updateCompanyPaymentAccount = AsyncHandler(async (req, res) => {
  const account = await companyService.updatePaymentAccount(
    req.params.id,
    req.params.accountId,
    req.user,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, 'PAYMENT_ACCOUNT_UPDATED', account, req.lang));
});

const toggleCompanyPaymentAccount = AsyncHandler(async (req, res) => {
  const account = await companyService.togglePaymentAccount(
    req.params.id,
    req.params.accountId,
    req.user
  );
  res
    .status(200)
    .json(new ApiResponse(200, 'PAYMENT_ACCOUNT_TOGGLED', account, req.lang));
});

const deleteCompanyPaymentAccount = AsyncHandler(async (req, res) => {
  await companyService.deleteCompanyPaymentAccount(
    req.params.id,
    req.params.accountId,
    req.user
  );
  res
    .status(200)
    .json(new ApiResponse(200, 'PAYMENT_ACCOUNT_DELETED', {}, req.lang));
});

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  addCompanyReview,
  getCompanyReviews,
  getCompanyPaymentAccounts,
  addCompanyPaymentAccount,
  updateCompanyPaymentAccount,
  toggleCompanyPaymentAccount,
  deleteCompanyPaymentAccount,
};
