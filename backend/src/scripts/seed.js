require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const { Transaction, CATEGORIES } = require('../models/transaction.model');
const connectDB = require('../config/db');

const randomAmount = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const seed = async () => {
  await connectDB();
  console.log('Connected. Seeding...');

  // Clear existing data
  await Promise.all([User.deleteMany(), Transaction.deleteMany()]);

  // Create users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@zoryn.dev',
    password: 'admin123',
    role: 'admin',
  });

  const analyst = await User.create({
    name: 'Analyst User',
    email: 'analyst@zoryn.dev',
    password: 'analyst123',
    role: 'analyst',
  });

  await User.create({
    name: 'Viewer User',
    email: 'viewer@zoryn.dev',
    password: 'viewer123',
    role: 'viewer',
  });

  console.log('Users created');

  // Create transactions spanning last 12 months
  const incomeCategories = ['salary', 'freelance', 'investment', 'business', 'gift'];
  const expenseCategories = ['food', 'housing', 'transport', 'utilities', 'healthcare', 'education', 'entertainment', 'shopping', 'travel'];

  const transactions = [];

  for (let i = 0; i < 120; i++) {
    const isIncome = Math.random() > 0.55;
    const type = isIncome ? 'income' : 'expense';
    const cats = isIncome ? incomeCategories : expenseCategories;

    transactions.push({
      amount: isIncome ? randomAmount(500, 8000) : randomAmount(20, 2000),
      type,
      category: randomItem(cats),
      date: daysAgo(Math.floor(Math.random() * 365)),
      notes: Math.random() > 0.5 ? `Sample ${type} entry #${i + 1}` : undefined,
      createdBy: Math.random() > 0.3 ? admin._id : analyst._id,
      isDeleted: false,
    });
  }

  await Transaction.insertMany(transactions);
  console.log(`${transactions.length} transactions created`);

  console.log('\n=== Seed complete ===');
  console.log('Admin:    admin@zoryn.dev    / admin123');
  console.log('Analyst:  analyst@zoryn.dev  / analyst123');
  console.log('Viewer:   viewer@zoryn.dev   / viewer123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
