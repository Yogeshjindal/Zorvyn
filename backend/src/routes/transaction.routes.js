const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transaction.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin, isAnalystOrAdmin, isAnyRole } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { CATEGORIES, TRANSACTION_TYPES } = require('../models/transaction.model');

const router = express.Router();

router.use(protect);

// GET /api/transactions — all roles can list
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
    query('type').optional().isIn(TRANSACTION_TYPES).withMessage('Invalid type'),
    query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  ],
  validate,
  isAnyRole,
  getTransactions
);

// GET /api/transactions/:id — analyst and admin
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid transaction ID')],
  validate,
  isAnalystOrAdmin,
  getTransactionById
);

// POST /api/transactions — admin only
router.post(
  '/',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(TRANSACTION_TYPES).withMessage('Type must be income or expense'),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  isAdmin,
  createTransaction
);

// PUT /api/transactions/:id — admin only
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('type').optional().isIn(TRANSACTION_TYPES).withMessage('Type must be income or expense'),
    body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  isAdmin,
  updateTransaction
);

// DELETE /api/transactions/:id — admin only (soft delete)
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid transaction ID')],
  validate,
  isAdmin,
  deleteTransaction
);

module.exports = router;
