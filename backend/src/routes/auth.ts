import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authLimiter } from '@/middleware/security';
import { authenticateToken } from '@/middleware/auth';
import {
  validateLogin,
  validateRegister,
} from '@/middleware/validation';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
