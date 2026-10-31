import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications, markAsRead, markAllAsRead, deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
