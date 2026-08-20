const AsyncHandler = require('../utils/AsyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const expenseService = require('../services/expense.service');

const getCompanyId = (req) => {
  if (req.user.role === 'company_admin') {
    return req.user.company ? (req.user.company._id || req.user.company) : null;
  }
  return req.query.companyId || (req.user.company ? (req.user.company._id || req.user.company) : null);
};

class ExpenseController {
  createExpense = AsyncHandler(async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const expense = await expenseService.createExpense(companyId, req.body, req.file);
    res.status(201).json(new ApiResponse(201, 'EXPENSE_CREATED_SUCCESSFULLY', expense, req.lang));
  });

  getExpenses = AsyncHandler(async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const result = await expenseService.getExpenses(companyId, req.query);
    res.status(200).json(new ApiResponse(200, 'EXPENSES_FETCHED', result, req.lang));
  });

  getExpensesSummary = AsyncHandler(async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const summary = await expenseService.getExpensesSummary(companyId, req.query);
    res.status(200).json(new ApiResponse(200, 'EXPENSES_SUMMARY_FETCHED', summary, req.lang));
  });

  updateExpense = AsyncHandler(async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    const expense = await expenseService.updateExpense(req.params.id, companyId, req.body, req.file);
    res.status(200).json(new ApiResponse(200, 'EXPENSE_UPDATED_SUCCESSFULLY', expense, req.lang));
  });

  deleteExpense = AsyncHandler(async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }
    await expenseService.deleteExpense(req.params.id, companyId);
    res.status(200).json(new ApiResponse(200, 'EXPENSE_DELETED_SUCCESSFULLY', {}, req.lang));
  });
}

module.exports = new ExpenseController();
