import express from 'express';
import { login, register, getMe, logout, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;
