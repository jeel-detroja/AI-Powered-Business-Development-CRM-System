import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Deal, Activity, Task } from '../models/index.js';
import { DEAL_STAGES } from '../constants/index.js';

// ── KPI Stats ──
export const getStats = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLeads,
    newLeadsThisMonth,
    qualifiedLeads,
    activeDeals,
    pipelineAgg,
    wonRevenueAgg,
    convertedLeads,
    overdueFollowups,
  ] = await Promise.all([
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true } }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Qualified' }),
    Deal.countDocuments({ organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } }),
    Deal.aggregate([
      { $match: { organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]),
    Deal.aggregate([
      { $match: { organization: orgId, isDeleted: { $ne: true }, stage: 'Won' } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Converted' }),
    Activity.countDocuments({ organization: orgId, isDeleted: { $ne: true }, isCompleted: false, dueAt: { $lt: now } }),
  ]);

  const totalPipelineValue = pipelineAgg[0]?.total || 0;
  const wonRevenue = wonRevenueAgg[0]?.total || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return sendSuccess(res, {
    data: {
      totalLeads, newLeadsThisMonth, qualifiedLeads, activeDeals,
      totalPipelineValue, wonRevenue, conversionRate, overdueFollowups,
    },
  });
});

// ── Recent Leads ──
export const getRecentLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find({ organization: req.orgId, isDeleted: { $ne: true } })
    .sort('-createdAt')
    .limit(5)
    .populate('assignedTo', 'firstName lastName avatarColor')
    .lean();
  return sendSuccess(res, { data: leads });
});

// ── Upcoming Activities ──
export const getUpcomingActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({
    organization: req.orgId,
    isDeleted: { $ne: true },
    isCompleted: false,
    dueAt: { $gte: new Date() },
  })
    .sort('dueAt')
    .limit(5)
    .populate('lead', 'firstName lastName')
    .populate('contact', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName avatarColor')
    .lean();
  return sendSuccess(res, { data: activities });
});

// ── Today's Tasks ──
export const getTodaysTasks = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    organization: req.orgId,
    isDeleted: { $ne: true },
    status: { $ne: 'Completed' },
    dueDate: { $gte: start, $lte: end },
  })
    .sort('dueDate')
    .populate('assignedTo', 'firstName lastName avatarColor')
    .lean();
  return sendSuccess(res, { data: tasks });
});

// ── Overdue Followups ──
export const getOverdueFollowups = asyncHandler(async (req, res) => {
  const filter = {
    organization: req.orgId,
    isDeleted: { $ne: true },
    isCompleted: false,
    dueAt: { $lt: new Date() },
  };
  if (req.user.role === 'rep') filter.assignedTo = req.user._id;

  const [activities, count] = await Promise.all([
    Activity.find(filter)
      .sort('dueAt')
      .limit(10)
      .populate('lead', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName avatarColor')
      .lean(),
    Activity.countDocuments(filter),
  ]);
  return sendSuccess(res, { data: { activities, count } });
});

// ── Recent Deals ──
export const getRecentDeals = asyncHandler(async (req, res) => {
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  if (req.user.role === 'rep') filter.owner = req.user._id;

  const deals = await Deal.find(filter)
    .sort('-updatedAt')
    .limit(5)
    .populate('owner', 'firstName lastName avatarColor')
    .populate('company', 'name')
    .lean();
  return sendSuccess(res, { data: deals });
});

// ── Leads Over Time (grouped by day/week/month) ──
export const getLeadsOverTime = asyncHandler(async (req, res) => {
  const { period = 'day', from, to } = req.query;

  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  } else {
    // Default: last 30 days
    const d = new Date();
    d.setDate(d.getDate() - 30);
    match.createdAt = { $gte: d };
  }

  const groupFormats = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
    week: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
    month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
  };

  const data = await Lead.aggregate([
    { $match: match },
    { $group: { _id: groupFormats[period] || groupFormats.day, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);

  return sendSuccess(res, { data });
});

// ── Lead Source Distribution ──
export const getLeadSourceDistribution = asyncHandler(async (req, res) => {
  const data = await Lead.aggregate([
    { $match: { organization: req.orgId, isDeleted: { $ne: true } } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, source: '$_id', count: 1 } },
  ]);
  return sendSuccess(res, { data });
});

// ── Pipeline Funnel (count + value by stage) ──
export const getPipelineFunnel = asyncHandler(async (req, res) => {
  const agg = await Deal.aggregate([
    { $match: { organization: req.orgId, isDeleted: { $ne: true } } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
    { $project: { _id: 0, stage: '$_id', count: 1, value: 1 } },
  ]);

  // Ensure all stages are present and ordered
  const map = Object.fromEntries(agg.map((a) => [a.stage, a]));
  const data = DEAL_STAGES.map((stage) => map[stage] || { stage, count: 0, value: 0 });

  return sendSuccess(res, { data });
});

// ── Deal Status Distribution ──
export const getDealStatusDistribution = asyncHandler(async (req, res) => {
  const data = await Deal.aggregate([
    { $match: { organization: req.orgId, isDeleted: { $ne: true } } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, stage: '$_id', count: 1, value: 1 } },
  ]);
  return sendSuccess(res, { data });
});

// ── Revenue Over Time (won deals grouped by month) ──
export const getRevenueOverTime = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true }, stage: 'Won' };
  if (from || to) {
    match.closedAt = {};
    if (from) match.closedAt.$gte = new Date(from);
    if (to) match.closedAt.$lte = new Date(to);
  } else {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
    match.closedAt = { $gte: d };
  }

  const data = await Deal.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$closedAt' } },
        revenue: { $sum: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', revenue: 1, count: 1 } },
  ]);

  return sendSuccess(res, { data });
});
