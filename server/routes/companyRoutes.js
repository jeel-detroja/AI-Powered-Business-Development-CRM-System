import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '../controllers/companyController.js';

const router = Router();
router.use(protect);

router.get('/', getCompanies);
router.post('/', createCompany);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', authorize('admin', 'manager'), deleteCompany);

export default router;
