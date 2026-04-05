const { Transaction } = require('../models/transaction.model');

/**
 * Returns total income, total expenses, and net balance.
 */
const getSummary = async ({ startDate, endDate } = {}) => {
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { isDeleted: false };
  if (Object.keys(dateFilter).length > 0) matchStage.date = dateFilter;

  const result = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const income = result.find((r) => r._id === 'income') || { total: 0, count: 0 };
  const expense = result.find((r) => r._id === 'expense') || { total: 0, count: 0 };

  return {
    totalIncome: income.total,
    totalExpenses: expense.total,
    netBalance: income.total - expense.total,
    totalTransactions: income.count + expense.count,
    incomeCount: income.count,
    expenseCount: expense.count,
  };
};

/**
 * Returns totals grouped by category.
 */
const getCategoryBreakdown = async ({ type, startDate, endDate } = {}) => {
  const matchStage = { isDeleted: false };
  if (type) matchStage.type = type;
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const result = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  return result;
};

/**
 * Returns monthly totals for income and expenses over the past N months.
 */
const getMonthlyTrends = async ({ months = 12 } = {}) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    { $match: { isDeleted: false, date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  // Normalize into month-keyed objects for easy frontend consumption
  const monthMap = {};
  result.forEach(({ year, month, type, total, count }) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { period: key, year, month, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    }
    monthMap[key][type] = total;
    monthMap[key][`${type}Count`] = count;
  });

  return Object.values(monthMap).sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * Returns the N most recent non-deleted transactions.
 */
const getRecentActivity = async ({ limit = 10 } = {}) => {
  return Transaction.find({ isDeleted: false })
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .limit(Number(limit));
};

/**
 * Returns weekly totals for current and previous week.
 */
const getWeeklyComparison = async () => {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const result = await Transaction.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startOfLastWeek },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          isCurrentWeek: { $gte: ['$date', startOfThisWeek] },
        },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const summary = { currentWeek: { income: 0, expense: 0 }, lastWeek: { income: 0, expense: 0 } };
  result.forEach(({ _id, total }) => {
    const week = _id.isCurrentWeek ? 'currentWeek' : 'lastWeek';
    summary[week][_id.type] = total;
  });

  return summary;
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyComparison,
};
