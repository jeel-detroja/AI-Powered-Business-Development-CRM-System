import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Deal, Activity } from '../models/index.js';
import { DEAL_STAGES, LEAD_SOURCES, LEAD_STATUS } from '../constants/index.js';

// ── Helpers ──
function dateRangeMatch(from, to) {
  if (!from && !to) return {};
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return range;
}

// ── Lead Generation Report ──
export const getLeadGenerationReport = asyncHandler(async (req, res) => {
  const { from, to, period = 'month' } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const groupFormats = {
    day: '%Y-%m-%d',
    week: '%Y-W%V',
    month: '%Y-%m',
  };
  const fmt = groupFormats[period] || groupFormats.month;

  const [overTime, bySource, byStatus, total] = await Promise.all([
    Lead.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, period: '$_id', count: 1 } },
    ]),
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
    ]),
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),
    Lead.countDocuments(match),
  ]);

  return sendSuccess(res, { data: { total, overTime, bySource, byStatus } });
});

// ── Lead Conversion Report ──
export const getLeadConversionReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const [byStatus, scoreDistribution, byPriority] = await Promise.all([
    Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgBudget: { $avg: '$estimatedBudget' },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, status: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, avgBudget: { $round: ['$avgBudget', 0] } } },
    ]),
    Lead.aggregate([
      { $match: { ...match, score: { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 20, 40, 60, 80, 101],
          default: 'Other',
          output: { count: { $sum: 1 }, label: { $first: '$category' } },
        },
      },
    ]),
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$priority', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $project: { _id: 0, priority: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] } } },
    ]),
  ]);

  const total = await Lead.countDocuments(match);
  const converted = await Lead.countDocuments({ ...match, status: 'Converted' });
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return sendSuccess(res, { data: { total, converted, conversionRate, byStatus, scoreDistribution, byPriority } });
});

// ── Sales Pipeline Report ──
export const getSalesPipelineReport = asyncHandler(async (req, res) => {
  const match = { organization: req.orgId, isDeleted: { $ne: true } };

  const stageData = await Deal.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
        avgProbability: { $avg: '$probability' },
      },
    },
    { $project: { _id: 0, stage: '$_id', count: 1, totalValue: 1, weightedValue: { $round: ['$weightedValue', 0] }, avgProbability: { $round: ['$avgProbability', 1] } } },
  ]);

  const map = Object.fromEntries(stageData.map((s) => [s.stage, s]));
  const pipeline = DEAL_STAGES.map((stage) => map[stage] || { stage, count: 0, totalValue: 0, weightedValue: 0, avgProbability: 0 });

  const totals = await Deal.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDeals: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgDealSize: { $avg: '$value' },
      },
    },
  ]);

  return sendSuccess(res, { data: { pipeline, summary: totals[0] || { totalDeals: 0, totalValue: 0, avgDealSize: 0 } } });
});

// ── Revenue Report ──
export const getRevenueReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true }, stage: 'Won' };
  const closedAt = dateRangeMatch(from, to);
  if (Object.keys(closedAt).length) match.closedAt = closedAt;
  else {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
    match.closedAt = { $gte: d };
  }

  const [byMonth, byRep] = await Promise.all([
    Deal.aggregate([
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
    ]),
    Deal.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$owner',
          revenue: { $sum: '$value' },
          count: { $sum: 1 },
          avgDealSize: { $avg: '$value' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'rep',
        },
      },
      { $unwind: { path: '$rep', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0,
          repId: '$_id',
          name: { $concat: [{ $ifNull: ['$rep.firstName', ''] }, ' ', { $ifNull: ['$rep.lastName', ''] }] },
          revenue: 1,
          count: 1,
          avgDealSize: { $round: ['$avgDealSize', 0] },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const totals = byMonth.reduce((acc, m) => ({ revenue: acc.revenue + m.revenue, count: acc.count + m.count }), { revenue: 0, count: 0 });

  return sendSuccess(res, { data: { ...totals, byMonth, byRep } });
});

// ── Deal Performance Report ──
export const getDealPerformanceReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const [byStage, winLossTrend] = await Promise.all([
    Deal.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          avgValue: { $avg: '$value' },
        },
      },
      {
        $project: {
          _id: 0, stage: '$_id', count: 1, totalValue: 1,
          avgValue: { $round: ['$avgValue', 0] },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Deal.aggregate([
      { $match: { ...match, stage: { $in: ['Won', 'Lost'] }, closedAt: { $exists: true } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$closedAt' } },
            stage: '$stage',
          },
          count: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
      { $sort: { '_id.month': 1 } },
      { $project: { _id: 0, month: '$_id.month', stage: '$_id.stage', count: 1, value: 1 } },
    ]),
  ]);

  const wonDeals = byStage.find((s) => s.stage === 'Won') || { count: 0 };
  const lostDeals = byStage.find((s) => s.stage === 'Lost') || { count: 0 };
  const totalClosed = wonDeals.count + lostDeals.count;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.count / totalClosed) * 100) : 0;

  return sendSuccess(res, { data: { byStage, winLossTrend, winRate, totalClosed } });
});

// ── Sales Rep Performance ──
export const getSalesRepPerformance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const [leadsByRep, dealsByRep] = await Promise.all([
    Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] } },
          avgScore: { $avg: '$score' },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0,
          repId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          avatarColor: '$user.avatarColor',
          totalLeads: 1, convertedLeads: 1, qualifiedLeads: 1,
          avgScore: { $round: ['$avgScore', 1] },
          conversionRate: {
            $round: [{ $multiply: [{ $cond: [{ $gt: ['$totalLeads', 0] }, { $divide: ['$convertedLeads', '$totalLeads'] }, 0] }, 100] }, 1],
          },
        },
      },
      { $sort: { totalLeads: -1 } },
    ]),
    Deal.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$owner',
          totalDeals: { $sum: 1 },
          wonDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, '$value', 0] } },
          pipelineValue: { $sum: { $cond: [{ $not: [{ $in: ['$stage', ['Won', 'Lost']] }] }, '$value', 0] } },
        },
      },
      { $project: { _id: 0, repId: '$_id', totalDeals: 1, wonDeals: 1, revenue: 1, pipelineValue: 1 } },
    ]),
  ]);

  // Merge lead and deal data
  const dealMap = Object.fromEntries(dealsByRep.map((d) => [String(d.repId), d]));
  const data = leadsByRep.map((rep) => ({
    ...rep,
    ...(dealMap[String(rep.repId)] || { totalDeals: 0, wonDeals: 0, revenue: 0, pipelineValue: 0 }),
  }));

  return sendSuccess(res, { data });
});

// ── Activity Report ──
export const getActivityReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const [byType, byStatus, byRep] = await Promise.all([
    Activity.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 }, completed: { $sum: { $cond: ['$isCompleted', 1, 0] } } } },
      { $project: { _id: 0, type: '$_id', count: 1, completed: 1 } },
      { $sort: { count: -1 } },
    ]),
    Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          overdue: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isCompleted', false] }, { $lt: ['$dueAt', new Date()] }] }, 1, 0],
            },
          },
        },
      },
      { $project: { _id: 0, total: 1, completed: 1, overdue: 1 } },
    ]),
    Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0, repId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          total: 1, completed: 1,
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  return sendSuccess(res, { data: { byType, summary: byStatus[0] || { total: 0, completed: 0, overdue: 0 }, byRep } });
});

// ── Lead Source Performance ──
export const getLeadSourcePerformance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { organization: req.orgId, isDeleted: { $ne: true } };
  const createdAt = dateRangeMatch(from, to);
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const data = await Lead.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        totalLeads: { $sum: 1 },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
        qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] } },
        avgScore: { $avg: '$score' },
        avgBudget: { $avg: '$estimatedBudget' },
      },
    },
    {
      $project: {
        _id: 0, source: '$_id', totalLeads: 1, convertedLeads: 1, qualifiedLeads: 1,
        avgScore: { $round: ['$avgScore', 1] },
        avgBudget: { $round: ['$avgBudget', 0] },
        conversionRate: {
          $round: [{
            $multiply: [
              { $cond: [{ $gt: ['$totalLeads', 0] }, { $divide: ['$convertedLeads', '$totalLeads'] }, 0] },
              100,
            ],
          }, 1],
        },
      },
    },
    { $sort: { totalLeads: -1 } },
  ]);

  return sendSuccess(res, { data });
});
