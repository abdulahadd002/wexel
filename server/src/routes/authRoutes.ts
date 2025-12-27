import { Router } from 'express';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authValidation } from '../middleware/validation';

const router = Router();

router.post('/register', authValidation.register, register);
router.post('/login', authValidation.login, login);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
