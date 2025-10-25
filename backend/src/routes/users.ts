import { Router } from 'express';
import { UsersController } from '@/controllers/usersController';
import { authenticateToken, requireCompanyAccess, requireRole } from '@/middleware/auth';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUUID,
  validatePagination,
} from '@/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireCompanyAccess);

// GET /api/users - Get all users with pagination
router.get('/', validatePagination, UsersController.getUsers);

// GET /api/users/:id - Get single user
router.get('/:id', validateUUID('id'), UsersController.getUser);

// POST /api/users - Create new user (admin/manager only)
router.post('/', requireRole(['admin', 'manager']), validateCreateUser, UsersController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validateUUID('id'), validateUpdateUser, UsersController.updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireRole(['admin']), validateUUID('id'), UsersController.deleteUser);

export default router;
