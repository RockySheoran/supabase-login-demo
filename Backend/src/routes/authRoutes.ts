import express from 'express';
import {
  loginWithEmail,
  loginWithProvider,
  handleProviderCallback,
  getProfile,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login/email', loginWithEmail);
router.get('/login/:provider', loginWithProvider);
router.get('/callback', handleProviderCallback);
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logout);

export default router;