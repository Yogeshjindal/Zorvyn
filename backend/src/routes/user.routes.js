const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');

const router = express.Router();

// All user management routes require auth + admin role
router.use(protect, isAdmin);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  getUserById
);

// POST /api/users
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['viewer', 'analyst', 'admin'])
      .withMessage('Role must be viewer, analyst, or admin'),
  ],
  validate,
  createUser
);

// PUT /api/users/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role')
      .optional()
      .isIn(['viewer', 'analyst', 'admin'])
      .withMessage('Role must be viewer, analyst, or admin'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  ],
  validate,
  updateUser
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  deleteUser
);

module.exports = router;
