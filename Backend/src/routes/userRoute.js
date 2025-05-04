import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  addFavorite,
  getFavorites,
  removeFavorite
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/favorites', protect, addFavorite);
router.get('/favorites', protect, getFavorites);
router.delete('/favorites/:id/:code', protect, removeFavorite);

export default router;
