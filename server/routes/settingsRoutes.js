import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getOrgSettings, updateOrgSettings, getAISettings } from '../controllers/settingsController.js';

const router = Router();
router.use(protect);

router.get('/organization', getOrgSettings);
router.put('/organization', authorize('admin'), updateOrgSettings);
router.get('/ai', getAISettings);

export default router;
