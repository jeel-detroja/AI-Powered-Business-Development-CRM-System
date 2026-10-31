import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { exportLeads, exportContacts, exportDeals } from '../controllers/exportController.js';

const router = Router();
router.use(protect);

router.get('/leads', exportLeads);
router.get('/contacts', exportContacts);
router.get('/deals', exportDeals);

export default router;
