const Expense = require('../models/expense.model');
const Trip = require('../models/trip.model');
const ApiError = require('../utils/ApiError');

class ExpenseService {
  /**
   * Add a new expense for a company
   */
  async createExpense(companyId, payload, file) {
    const { tripId, category, title, amount, expenseDate, notes } = payload;

    if (!title || amount === undefined) {
      throw new ApiError(400, 'TITLE_AND_AMOUNT_REQUIRED');
    }

    if (tripId) {
      const trip = await Trip.findOne({ _id: tripId, company: companyId, isDeleted: false });
      if (!trip) {
        throw new ApiError(404, 'TRIP_NOT_FOUND_FOR_COMPANY');
      }
    }

    let receiptImage = '';
    if (file) {
      receiptImage = `/uploads/expenses/${file.filename}`;
    }

    const expense = await Expense.create({
      company: companyId,
      trip: tripId || null,
      category: category || 'other',
      title,
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || '',
      receiptImage,
    });

    return expense;
  }

  /**
   * Get company expenses with filters and pagination
   */
  async getExpenses(companyId, query = {}) {
    const { page = 1, limit = 20, tripId, category, startDate, endDate, search } = query;
    const filter = { company: companyId, isDeleted: false };

    if (tripId) {
      filter.trip = tripId;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.title = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('trip', 'title origin destination startDate endDate')
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);

    return {
      expenses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get summary of expenses grouped by category or trip
   */
  async getExpensesSummary(companyId, query = {}) {
    const { tripId, startDate, endDate } = query;
    const matchFilter = { company: companyId, isDeleted: false };

    if (tripId) {
      matchFilter.trip = tripId;
    }

    if (startDate || endDate) {
      matchFilter.expenseDate = {};
      if (startDate) matchFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) matchFilter.expenseDate.$lte = new Date(endDate);
    }

    const mongoose = require('mongoose');
    if (typeof matchFilter.company === 'string') {
      matchFilter.company = new mongoose.Types.ObjectId(matchFilter.company);
    }

    const categoryAgg = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAgg = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ]);

    const totalExpenses = totalAgg.length > 0 ? totalAgg[0].totalExpenses : 0;

    return {
      totalExpenses,
      byCategory: categoryAgg,
    };
  }

  /**
   * Update expense item
   */
  async updateExpense(expenseId, companyId, updateData, file) {
    const expense = await Expense.findOne({ _id: expenseId, company: companyId, isDeleted: false });
    if (!expense) {
      throw new ApiError(404, 'EXPENSE_NOT_FOUND');
    }

    const allowedFields = ['title', 'amount', 'category', 'trip', 'expenseDate', 'notes'];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === 'amount') {
          expense[field] = Number(updateData[field]);
        } else if (field === 'expenseDate') {
          expense[field] = new Date(updateData[field]);
        } else {
          expense[field] = updateData[field];
        }
      }
    });

    if (file) {
      expense.receiptImage = `/uploads/expenses/${file.filename}`;
    }

    await expense.save();
    return expense;
  }

  /**
   * Soft delete expense
   */
  async deleteExpense(expenseId, companyId) {
    const expense = await Expense.findOne({ _id: expenseId, company: companyId, isDeleted: false });
    if (!expense) {
      throw new ApiError(404, 'EXPENSE_NOT_FOUND');
    }

    expense.isDeleted = true;
    await expense.save();
    return true;
  }
}

module.exports = new ExpenseService();
