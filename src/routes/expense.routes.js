const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadExpenseReceipt } = require('../middlewares/expenseUploadMiddleware');
const expenseController = require('../controllers/expense.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('company_admin', 'super_admin', 'admin'));

router.post('/', uploadExpenseReceipt, expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpensesSummary);
router.put('/:id', uploadExpenseReceipt, expenseController.updateExpense);
router.patch('/:id', uploadExpenseReceipt, expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
