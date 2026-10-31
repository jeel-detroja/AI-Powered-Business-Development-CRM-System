import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getLeads, getLead, createLead, updateLead, deleteLead,
  bulkUpdateStatus, bulkAssign, checkDuplicates, analyzeLead, getLeadAnalysis,
} from '../controllers/leadController.js';

const router = Router();
router.use(protect);

router.get('/', getLeads);
router.post('/', createLead);
router.get('/check-duplicates', checkDuplicates);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', authorize('admin', 'manager'), deleteLead);
router.post('/:id/analyze', analyzeLead);
router.get('/:id/analysis', getLeadAnalysis);
router.post('/bulk/status', bulkUpdateStatus);
router.post('/bulk/assign', authorize('admin', 'manager'), bulkAssign);

export default router;
