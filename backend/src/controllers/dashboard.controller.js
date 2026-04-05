const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await dashboardService.getSummary({ startDate, endDate });
  ApiResponse.ok(res, data);
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  const data = await dashboardService.getCategoryBreakdown({ type, startDate, endDate });
  ApiResponse.ok(res, { categories: data });
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const { months } = req.query;
  const data = await dashboardService.getMonthlyTrends({ months });
  ApiResponse.ok(res, { trends: data });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const data = await dashboardService.getRecentActivity({ limit });
  ApiResponse.ok(res, { transactions: data });
});

const getWeeklyComparison = asyncHandler(async (req, res) => {
  const data = await dashboardService.getWeeklyComparison();
  ApiResponse.ok(res, data);
});

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyComparison,
};
