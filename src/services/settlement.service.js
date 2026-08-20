const Settlement = require('../models/settlement.model');
const Company = require('../models/company.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const activityService = require('./activity.service');
const { getPagingData } = require('../utils/pagination.util');
const { getMonthDateRange } = require('../utils/analytics.util');
const { BookingStatus } = require('../constants/enums');

class SettlementService {
  /**
   * Get monthly settlements list across companies
   */
  async getMonthlySettlements({ month, year, search = '', page = 1, limit = 10 }) {
    const now = new Date();
    const currentMonth = month ? Number(month) : now.getMonth() + 1;
    const currentYear = year ? Number(year) : now.getFullYear();

    const period = getMonthDateRange(currentMonth, currentYear);
    const { startDate, endDate } = period;

    const companyFilter = { isDeleted: false };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      companyFilter.name = searchRegex;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      Company.find(companyFilter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Company.countDocuments(companyFilter),
    ]);

    const settlements = await Promise.all(
      companies.map(async (company) => {
        let settlement = await Settlement.findOne({
          company: company._id,
          month: currentMonth,
          year: currentYear,
        });

        const bookingsAgg = await Booking.aggregate([
          {
            $match: {
              company: company._id,
              status: BookingStatus.APPROVED,
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalGrossSales: { $sum: '$totalPrice' },
              totalCommissionAmount: { $sum: '$adminCommissionAmount' },
            },
          },
        ]);

        const grossSales = bookingsAgg.length > 0 ? bookingsAgg[0].totalGrossSales : 0;
        const dueCommission = bookingsAgg.length > 0 ? bookingsAgg[0].totalCommissionAmount : 0;

        if (!settlement) {
          settlement = await Settlement.create({
            company: company._id,
            month: currentMonth,
            year: currentYear,
            totalGrossSales: grossSales,
            totalCommissionAmount: dueCommission,
            paidAmount: 0,
            remainingAmount: dueCommission,
            status: dueCommission === 0 ? 'settled' : 'pending',
          });
        } else {
          settlement.totalGrossSales = grossSales;
          settlement.totalCommissionAmount = dueCommission;
          settlement.remainingAmount = Math.max(0, dueCommission - settlement.paidAmount);

          if (settlement.remainingAmount === 0 && dueCommission > 0) {
            settlement.status = 'settled';
          } else if (settlement.paidAmount > 0) {
            settlement.status = 'partially_paid';
          } else {
            settlement.status = 'pending';
          }
          await settlement.save();
        }

        const setObj = settlement.toObject();
        setObj.company = {
          _id: company._id,
          name: company.name,
          logo: company.logo,
          contactPhone: company.contactPhone,
          contactEmail: company.contactEmail,
          commissionType: company.commissionType,
          commissionValue: company.commissionValue,
        };

        return setObj;
      })
    );

    return {
      period: { month: currentMonth, year: currentYear },
      ...getPagingData(settlements, total, Number(page), Number(limit), 'settlements'),
    };
  }

  /**
   * Record a payment against company commission settlement
   */
  async recordSettlementPayment({ companyId, month, year, amount, paymentMethod, referenceNumber, notes }, adminUser) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    const currentMonth = Number(month);
    const currentYear = Number(year);
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new ApiError(400, 'INVALID_PAYMENT_AMOUNT');
    }

    let settlement = await Settlement.findOne({
      company: companyId,
      month: currentMonth,
      year: currentYear,
    });

    if (!settlement) {
      const period = getMonthDateRange(currentMonth, currentYear);
      const bookingsAgg = await Booking.aggregate([
        {
          $match: {
            company: company._id,
            status: BookingStatus.APPROVED,
            createdAt: { $gte: period.startDate, $lte: period.endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalGrossSales: { $sum: '$totalPrice' },
            totalCommissionAmount: { $sum: '$adminCommissionAmount' },
          },
        },
      ]);

      const grossSales = bookingsAgg.length > 0 ? bookingsAgg[0].totalGrossSales : 0;
      const dueCommission = bookingsAgg.length > 0 ? bookingsAgg[0].totalCommissionAmount : 0;

      settlement = await Settlement.create({
        company: companyId,
        month: currentMonth,
        year: currentYear,
        totalGrossSales: grossSales,
        totalCommissionAmount: dueCommission,
        paidAmount: 0,
        remainingAmount: dueCommission,
        status: 'pending',
      });
    }

    settlement.paidAmount += paymentAmount;
    settlement.remainingAmount = Math.max(0, settlement.totalCommissionAmount - settlement.paidAmount);

    if (settlement.remainingAmount === 0 && settlement.totalCommissionAmount > 0) {
      settlement.status = 'settled';
    } else {
      settlement.status = 'partially_paid';
    }

    settlement.paymentHistory.push({
      amount: paymentAmount,
      paidAt: new Date(),
      paymentMethod: paymentMethod || 'cash',
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      recordedBy: adminUser ? adminUser._id : null,
    });

    await settlement.save();

    try {
      await activityService.logActivity({
        actor: adminUser ? adminUser._id : null,
        actorType: 'Admin',
        action: 'RECORD_SETTLEMENT_PAYMENT',
        targetType: 'Company',
        targetId: companyId,
        details: `Recorded settlement payment of ${paymentAmount} EGP for company ${company.name} (${currentMonth}/${currentYear}).`,
      });
    } catch (e) {}

    return settlement;
  }
}

module.exports = new SettlementService();
