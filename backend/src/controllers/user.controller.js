const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  ApiResponse.ok(res, result);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.ok(res, { user });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await userService.createUser({ name, email, password, role });
  ApiResponse.created(res, { user }, 'User created successfully');
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive } = req.body;
  const user = await userService.updateUser(req.params.id, { name, email, role, isActive });
  ApiResponse.ok(res, { user }, 'User updated successfully');
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  ApiResponse.ok(res, null, 'User deleted successfully');
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
