import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { importLeads, importContacts } from '../controllers/importController.js';

const router = Router();
router.use(protect);
router.use(authorize('admin', 'manager'));

router.post('/leads', importLeads);
router.post('/contacts', importContacts);

export default router;
