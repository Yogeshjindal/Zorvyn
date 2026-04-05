const transactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(req.query);
  ApiResponse.ok(res, result);
});

const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(req.params.id);
  ApiResponse.ok(res, { transaction });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const transaction = await transactionService.createTransaction(
    { amount, type, category, date, notes },
    req.user._id
  );
  ApiResponse.created(res, { transaction }, 'Transaction created');
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const transaction = await transactionService.updateTransaction(req.params.id, {
    amount,
    type,
    category,
    date,
    notes,
  });
  ApiResponse.ok(res, { transaction }, 'Transaction updated');
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.params.id);
  ApiResponse.ok(res, null, 'Transaction deleted');
});

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
