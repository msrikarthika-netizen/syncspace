import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../../controllers/authController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);

export default router;
