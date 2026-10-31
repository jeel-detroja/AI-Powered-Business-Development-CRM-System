import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController.js';

const router = Router();
router.use(protect);

router.get('/', getContacts);
router.post('/', createContact);
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', authorize('admin', 'manager'), deleteContact);

export default router;
