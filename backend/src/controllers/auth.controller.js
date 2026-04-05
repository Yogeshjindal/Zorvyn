const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, token } = await authService.register({ name, email, password });
  ApiResponse.created(res, { user, token }, 'Registration successful');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });
  ApiResponse.ok(res, { user, token }, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  ApiResponse.ok(res, { user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await authService.updateMe(req.user._id, { name, email });
  ApiResponse.ok(res, { user }, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, { currentPassword, newPassword });
  ApiResponse.ok(res, null, 'Password changed successfully');
});

module.exports = { register, login, getMe, updateMe, changePassword };
