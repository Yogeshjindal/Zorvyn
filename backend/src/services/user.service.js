const { User, ROLES } = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const getAllUsers = async ({ page = 1, limit = 20, role, isActive, search }) => {
  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const createUser = async ({ name, email, password, role }) => {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, role: role || 'viewer' });
  return user;
};

const updateUser = async (id, { name, email, role, isActive }) => {
  if (email) {
    const taken = await User.findOne({ email, _id: { $ne: id } });
    if (taken) throw ApiError.conflict('Email already in use');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { name, email, role, isActive },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const deleteUser = async (id, requestingUserId) => {
  if (id === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound('User not found');
  return true;
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
