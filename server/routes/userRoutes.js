import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getUsers, getUser, updateUser, toggleUserActive, changePassword, updateProfile,
} from '../controllers/userController.js';

const router = Router();
router.use(protect);

router.get('/', authorize('admin', 'manager'), getUsers);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-active', authorize('admin'), toggleUserActive);
router.patch('/:id/change-password', changePassword);

export default router;
