import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getStats, getRecentLeads, getUpcomingActivities, getTodaysTasks,
  getOverdueFollowups, getRecentDeals, getLeadsOverTime,
  getLeadSourceDistribution, getPipelineFunnel, getDealStatusDistribution,
  getRevenueOverTime,
} from '../controllers/dashboardController.js';

const router = Router();
router.use(protect);

router.get('/stats', getStats);
router.get('/recent-leads', getRecentLeads);
router.get('/upcoming-activities', getUpcomingActivities);
router.get('/todays-tasks', getTodaysTasks);
router.get('/overdue-followups', getOverdueFollowups);
router.get('/recent-deals', getRecentDeals);
router.get('/leads-over-time', getLeadsOverTime);
router.get('/lead-source-distribution', getLeadSourceDistribution);
router.get('/pipeline-funnel', getPipelineFunnel);
router.get('/deal-status-distribution', getDealStatusDistribution);
router.get('/revenue-over-time', getRevenueOverTime);

export default router;
