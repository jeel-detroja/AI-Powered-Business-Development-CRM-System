import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getDeals, getPipeline, getDeal, createDeal, updateDeal, moveDealStage, deleteDeal } from '../controllers/dealController.js';

const router = Router();
router.use(protect);

router.get('/', getDeals);
router.get('/pipeline', getPipeline);
router.post('/', createDeal);
router.get('/:id', getDeal);
router.put('/:id', updateDeal);
router.patch('/:id/stage', moveDealStage);
router.delete('/:id', authorize('admin', 'manager'), deleteDeal);

export default router;
