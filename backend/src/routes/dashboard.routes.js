const express = require('express');
const { query } = require('express-validator');
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyComparison,
} = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAnyRole, isAnalystOrAdmin } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { TRANSACTION_TYPES } = require('../models/transaction.model');

const router = express.Router();

router.use(protect);

// GET /api/dashboard/summary — all roles
router.get(
  '/summary',
  [
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  ],
  validate,
  isAnyRole,
  getSummary
);

// GET /api/dashboard/recent — all roles
router.get(
  '/recent',
  [query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50')],
  validate,
  isAnyRole,
  getRecentActivity
);

// GET /api/dashboard/weekly — all roles
router.get('/weekly', isAnyRole, getWeeklyComparison);

// GET /api/dashboard/categories — analyst and admin
router.get(
  '/categories',
  [
    query('type').optional().isIn(TRANSACTION_TYPES).withMessage('Invalid type'),
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  ],
  validate,
  isAnalystOrAdmin,
  getCategoryBreakdown
);

// GET /api/dashboard/trends — analyst and admin
router.get(
  '/trends',
  [query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be 1–24')],
  validate,
  isAnalystOrAdmin,
  getMonthlyTrends
);

module.exports = router;
