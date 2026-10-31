import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getLeadGenerationReport, getLeadConversionReport, getSalesPipelineReport,
  getRevenueReport, getDealPerformanceReport, getSalesRepPerformance,
  getActivityReport, getLeadSourcePerformance,
} from '../controllers/analyticsController.js';

const router = Router();
router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/lead-generation', getLeadGenerationReport);
router.get('/lead-conversion', getLeadConversionReport);
router.get('/sales-pipeline', getSalesPipelineReport);
router.get('/revenue', getRevenueReport);
router.get('/deal-performance', getDealPerformanceReport);
router.get('/sales-rep-performance', getSalesRepPerformance);
router.get('/activity', getActivityReport);
router.get('/lead-source-performance', getLeadSourcePerformance);

export default router;
