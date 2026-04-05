const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async ({ name, email, password, role }) => {
  const exists = await User.findOne({ email });
  if (exists) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create({ name, email, password, role: role || 'viewer' });
  const token = signToken(user._id);

  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const token = signToken(user._id);

  // Remove password from returned user object
  user.password = undefined;

  return { user, token };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateMe = async (userId, { name, email }) => {
  // Check if new email is taken by another user
  if (email) {
    const taken = await User.findOne({ email, _id: { $ne: userId } });
    if (taken) throw ApiError.conflict('Email already in use');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.unauthorized('Current password is incorrect');

  user.password = newPassword;
  await user.save();
  return true;
};

module.exports = { register, login, getMe, updateMe, changePassword, signToken };
