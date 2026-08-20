const { CommissionType } = require('../constants/enums');

/**
 * Strategy Pattern Interface for Commission Calculations
 */
class CommissionStrategy {
  calculate({ totalPrice, seats, commissionValue }) {
    throw new Error('Method calculate() must be implemented');
  }
}

class PercentageCommissionStrategy extends CommissionStrategy {
  calculate({ totalPrice, commissionValue }) {
    const adminCommissionAmount = Number(((totalPrice * commissionValue) / 100).toFixed(2));
    const companyNetAmount = Number((totalPrice - adminCommissionAmount).toFixed(2));
    return { adminCommissionAmount, companyNetAmount };
  }
}

class FixedCommissionStrategy extends CommissionStrategy {
  calculate({ totalPrice, seats, commissionValue }) {
    const adminCommissionAmount = Number((commissionValue * seats).toFixed(2));
    const companyNetAmount = Number((totalPrice - adminCommissionAmount).toFixed(2));
    return { adminCommissionAmount, companyNetAmount };
  }
}

class CommissionStrategyFactory {
  static getStrategy(type) {
    switch (type) {
      case CommissionType.FIXED:
        return new FixedCommissionStrategy();
      case CommissionType.PERCENTAGE:
      default:
        return new PercentageCommissionStrategy();
    }
  }

  static calculateCommission({ commissionType, totalPrice, seats, commissionValue }) {
    const strategy = this.getStrategy(commissionType);
    return strategy.calculate({ totalPrice, seats, commissionValue });
  }
}

module.exports = {
  CommissionStrategy,
  PercentageCommissionStrategy,
  FixedCommissionStrategy,
  CommissionStrategyFactory,
};
