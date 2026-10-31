import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { Deal } from '../models/index.js';
import { DEAL_STAGES, LEAD_PRIORITY } from '../constants/index.js';

const dealSchema = z.object({
  title: z.string().trim().min(1),
  value: z.coerce.number().min(0).optional().default(0),
  stage: z.enum(DEAL_STAGES).optional().default('Qualification'),
  probability: z.coerce.number().min(0).max(100).optional().default(10),
  priority: z.enum(LEAD_PRIORITY).optional().default('Medium'),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  company: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  lead: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
});

export const getDeals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['title', 'value', 'createdAt', 'stage', 'probability'], '-createdAt');
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.title = regex;
  }
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.owner) filter.owner = req.query.owner;
  if (req.user.role === 'rep') filter.owner = req.user._id;

  const [deals, total] = await Promise.all([
    Deal.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('owner', 'firstName lastName avatarColor')
      .populate('company', 'name')
      .populate('contact', 'firstName lastName')
      .lean(),
    Deal.countDocuments(filter),
  ]);
  return sendSuccess(res, { data: deals, meta: buildMeta({ page, limit, total }) });
});

// ── Pipeline view — get all deals grouped by stage ──
export const getPipeline = asyncHandler(async (req, res) => {
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  if (req.user.role === 'rep') filter.owner = req.user._id;

  const deals = await Deal.find(filter)
    .populate('owner', 'firstName lastName avatarColor')
    .populate('company', 'name')
    .populate('contact', 'firstName lastName')
    .sort('createdAt')
    .lean();

  const pipeline = {};
  for (const stage of DEAL_STAGES) {
    pipeline[stage] = deals.filter((d) => d.stage === stage);
  }

  // Calculate pipeline metrics
  const activeDeals = deals.filter((d) => !['Won', 'Lost'].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === 'Won');
  const lostDeals = deals.filter((d) => d.stage === 'Lost');
  const totalPipelineValue = activeDeals.reduce((s, d) => s + (d.value || 0), 0);
  const weightedPipelineValue = activeDeals.reduce((s, d) => s + (d.value || 0) * ((d.probability || 0) / 100), 0);
  const wonRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const lostValue = lostDeals.reduce((s, d) => s + (d.value || 0), 0);
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + (d.value || 0), 0) / deals.length) : 0;

  return sendSuccess(res, {
    data: {
      pipeline,
      metrics: { totalPipelineValue, weightedPipelineValue, wonRevenue, lostValue, winRate, avgDealSize, totalDeals: deals.length, activeDeals: activeDeals.length },
    },
  });
});

export const getDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('owner', 'firstName lastName email avatarColor')
    .populate('company', 'name website industry')
    .populate('contact', 'firstName lastName email phone')
    .populate('lead', 'firstName lastName status')
    .populate('stageHistory.changedBy', 'firstName lastName');
  if (!deal) throw ApiError.notFound('Deal not found');
  return sendSuccess(res, { data: deal });
});

export const createDeal = asyncHandler(async (req, res) => {
  const body = dealSchema.parse(req.body);
  const deal = await Deal.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    owner: body.owner || req.user._id,
    stageHistory: [{ stage: body.stage || 'Qualification', changedAt: new Date(), changedBy: req.user._id }],
  });
  return sendSuccess(res, { status: 201, message: 'Deal created', data: deal });
});

export const updateDeal = asyncHandler(async (req, res) => {
  const body = dealSchema.partial().parse(req.body);
  const deal = await Deal.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!deal) throw ApiError.notFound('Deal not found');

  // Track stage changes
  if (body.stage && body.stage !== deal.stage) {
    deal.stageHistory.push({ stage: body.stage, changedAt: new Date(), changedBy: req.user._id });
    if (body.stage === 'Won' || body.stage === 'Lost') {
      deal.closedAt = new Date();
    }
  }

  Object.assign(deal, body);
  await deal.save();
  return sendSuccess(res, { message: 'Deal updated', data: deal });
});

// ── Move deal stage (for drag-and-drop) ──
export const moveDealStage = asyncHandler(async (req, res) => {
  const { stage } = z.object({ stage: z.enum(DEAL_STAGES) }).parse(req.body);
  const deal = await Deal.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!deal) throw ApiError.notFound('Deal not found');

  if (deal.stage !== stage) {
    deal.stageHistory.push({ stage, changedAt: new Date(), changedBy: req.user._id });
    deal.stage = stage;
    if (stage === 'Won' || stage === 'Lost') deal.closedAt = new Date();
    await deal.save();
  }
  return sendSuccess(res, { message: `Deal moved to ${stage}`, data: deal });
});

export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!deal) throw ApiError.notFound('Deal not found');
  return sendSuccess(res, { message: 'Deal deleted' });
});
