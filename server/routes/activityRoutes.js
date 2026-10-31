import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getActivities, getActivity, createActivity, updateActivity,
  completeActivity, rescheduleActivity, deleteActivity,
} from '../controllers/activityController.js';

const router = Router();
router.use(protect);

router.get('/', getActivities);
router.post('/', createActivity);
router.get('/:id', getActivity);
router.put('/:id', updateActivity);
router.patch('/:id/complete', completeActivity);
router.patch('/:id/reschedule', rescheduleActivity);
router.delete('/:id', authorize('admin', 'manager'), deleteActivity);

export default router;
