import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getTasks, getTask, createTask, updateTask, deleteTask, completeTask,
} from '../controllers/taskController.js';

const router = Router();
router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/complete', completeTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

export default router;
