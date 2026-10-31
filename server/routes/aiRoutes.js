import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { chat, generateEmail, getBusinessInsights, testConnection } from '../controllers/aiController.js';

const router = Router();
router.use(protect);

router.post('/assistant', chat);
router.post('/generate-email', generateEmail);
router.get('/insights', getBusinessInsights);
router.get('/test', testConnection);

export default router;
