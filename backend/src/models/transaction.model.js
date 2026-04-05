const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['income', 'expense'];

const CATEGORIES = [
  // Income categories
  'salary',
  'freelance',
  'investment',
  'business',
  'gift',
  // Expense categories
  'food',
  'housing',
  'transport',
  'utilities',
  'healthcare',
  'education',
  'entertainment',
  'shopping',
  'travel',
  'insurance',
  'savings',
  'other',
];

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // hidden from query results by default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common query patterns
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ isDeleted: 1 });

// Compound index for filtered listing
transactionSchema.index({ isDeleted: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction, TRANSACTION_TYPES, CATEGORIES };
