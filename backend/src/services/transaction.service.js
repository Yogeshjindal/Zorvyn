const { Transaction } = require('../models/transaction.model');
const ApiError = require('../utils/ApiError');

const getTransactions = async ({
  page = 1,
  limit = 20,
  type,
  category,
  startDate,
  endDate,
  search,
  sortBy = 'date',
  sortOrder = 'desc',
}) => {
  const filter = { isDeleted: false };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { notes: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getTransactionById = async (id) => {
  const transaction = await Transaction.findOne({ _id: id, isDeleted: false }).populate(
    'createdBy',
    'name email'
  );
  if (!transaction) throw ApiError.notFound('Transaction not found');
  return transaction;
};

const createTransaction = async (data, userId) => {
  const transaction = await Transaction.create({ ...data, createdBy: userId });
  return transaction.populate('createdBy', 'name email');
};

const updateTransaction = async (id, data) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  if (!transaction) throw ApiError.notFound('Transaction not found');
  return transaction;
};

const deleteTransaction = async (id) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!transaction) throw ApiError.notFound('Transaction not found');
  return true;
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
