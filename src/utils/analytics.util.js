/**
 * Analytics and Date Helper Utilities for Admin Financial Reports
 */

/**
 * Calculates start and end Date objects for a given month (1-12) and year (e.g. 2026).
 * Defaults to current active month and year if omitted or invalid.
 */
function getMonthDateRange(monthInput, yearInput) {
  const now = new Date();
  
  let year = Number(yearInput);
  if (!year || isNaN(year) || year < 2000 || year > 2100) {
    year = now.getFullYear();
  }

  let month = Number(monthInput);
  if (!month || isNaN(month) || month < 1 || month > 12) {
    month = now.getMonth() + 1; // 1-indexed (1 = January, 12 = December)
  }

  // Start of the month: Year-Month-01 00:00:00.000 Z
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));

  // End of the month: Last millisecond of the month
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    month,
    year,
    startDate,
    endDate,
  };
}

module.exports = {
  getMonthDateRange,
};
