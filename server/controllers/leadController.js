import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { Lead, AIAnalysis } from '../models/index.js';
import { analyzeLeadWithAI, calculateLeadScore, isAIEnabled } from '../services/gemini/index.js';
import { LEAD_STATUS, LEAD_SOURCES, LEAD_PRIORITY } from '../constants/index.js';

const leadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional().default(''),
  email: z.string().trim().email().optional().or(z.literal('')).default(''),
  phone: z.string().trim().optional().default(''),
  companyName: z.string().trim().optional().default(''),
  jobTitle: z.string().trim().optional().default(''),
  industry: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  website: z.string().trim().optional().default(''),
  source: z.enum(LEAD_SOURCES).optional().default('Other'),
  status: z.enum(LEAD_STATUS).optional().default('New'),
  priority: z.enum(LEAD_PRIORITY).optional().default('Medium'),
  estimatedBudget: z.coerce.number().min(0).optional().default(0),
  requirements: z.string().trim().optional().default(''),
  interestedIn: z.string().trim().optional().default(''),
  assignedTo: z.string().optional().nullable(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().default(''),
  tags: z.array(z.string().trim()).optional().default([]),
});

// ── List leads ──
export const getLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['firstName', 'lastName', 'createdAt', 'score', 'priority', 'status'], '-createdAt');

  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { companyName: regex }, { email: regex }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.industry) filter.industry = new RegExp(escapeRegex(req.query.industry), 'i');
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.category) filter.category = req.query.category;

  // Role-based filtering
  if (req.user.role === 'rep') {
    filter.assignedTo = req.user._id;
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('assignedTo', 'firstName lastName avatarColor')
      .populate('company', 'name')
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: leads, meta: buildMeta({ page, limit, total }) });
});

// ── Get single lead ──
export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('assignedTo', 'firstName lastName email avatarColor')
    .populate('company', 'name website industry');
  if (!lead) throw ApiError.notFound('Lead not found');
  return sendSuccess(res, { data: lead });
});

// ── Create lead ──
export const createLead = asyncHandler(async (req, res) => {
  const body = leadSchema.parse(req.body);
  const lead = await Lead.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    assignedTo: body.assignedTo || req.user._id,
  });

  // Calculate initial score
  const { score, category, breakdown } = calculateLeadScore(lead);
  lead.score = score;
  lead.category = category;
  lead.scoreBreakdown = breakdown;
  lead.scoredAt = new Date();
  await lead.save();

  return sendSuccess(res, { status: 201, message: 'Lead created', data: lead });
});

// ── Update lead ──
export const updateLead = asyncHandler(async (req, res) => {
  const body = leadSchema.partial().parse(req.body);
  const lead = await Lead.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!lead) throw ApiError.notFound('Lead not found');

  // Role check: reps can only update their assigned leads
  if (req.user.role === 'rep' && String(lead.assignedTo) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only update leads assigned to you');
  }

  Object.assign(lead, body);

  // Recalculate score
  const { score, category, breakdown } = calculateLeadScore(lead);
  lead.score = score;
  lead.category = category;
  lead.scoreBreakdown = breakdown;
  lead.scoredAt = new Date();

  await lead.save();
  return sendSuccess(res, { message: 'Lead updated', data: lead });
});

// ── Delete lead (soft) ──
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!lead) throw ApiError.notFound('Lead not found');
  lead.isDeleted = true;
  await lead.save();
  return sendSuccess(res, { message: 'Lead deleted' });
});

// ── Bulk update status ──
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = z.object({
    ids: z.array(z.string()).min(1),
    status: z.enum(LEAD_STATUS),
  }).parse(req.body);

  const result = await Lead.updateMany(
    { _id: { $in: ids }, organization: req.orgId, isDeleted: { $ne: true } },
    { $set: { status } }
  );
  return sendSuccess(res, { message: `${result.modifiedCount} leads updated`, data: { modified: result.modifiedCount } });
});

// ── Bulk assign ──
export const bulkAssign = asyncHandler(async (req, res) => {
  const { ids, assignedTo } = z.object({
    ids: z.array(z.string()).min(1),
    assignedTo: z.string(),
  }).parse(req.body);

  const result = await Lead.updateMany(
    { _id: { $in: ids }, organization: req.orgId, isDeleted: { $ne: true } },
    { $set: { assignedTo } }
  );
  return sendSuccess(res, { message: `${result.modifiedCount} leads assigned`, data: { modified: result.modifiedCount } });
});

// ── Duplicate detection ──
export const checkDuplicates = asyncHandler(async (req, res) => {
  const { email, phone, companyName, firstName, lastName } = req.query;
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  const orConditions = [];
  if (email) orConditions.push({ email: email.toLowerCase() });
  if (phone) orConditions.push({ phone });
  if (firstName && lastName && companyName) {
    orConditions.push({ firstName: new RegExp(`^${escapeRegex(firstName)}$`, 'i'), lastName: new RegExp(`^${escapeRegex(lastName)}$`, 'i'), companyName: new RegExp(`^${escapeRegex(companyName)}$`, 'i') });
  }
  if (!orConditions.length) return sendSuccess(res, { data: [] });
  filter.$or = orConditions;
  const duplicates = await Lead.find(filter).limit(10).select('firstName lastName email phone companyName status').lean();
  return sendSuccess(res, { data: duplicates });
});

// ── AI Analyze lead ──
export const analyzeLead = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY in environment variables.');
  const lead = await Lead.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!lead) throw ApiError.notFound('Lead not found');

  const analysis = await analyzeLeadWithAI(lead);

  // Update score with AI qualitative
  const { score, category, breakdown } = calculateLeadScore(lead, analysis.qualitative);
  lead.score = score;
  lead.category = category;
  lead.scoreBreakdown = breakdown;
  lead.scoredAt = new Date();
  await lead.save();

  // Store analysis
  await AIAnalysis.findOneAndUpdate(
    { lead: lead._id, organization: req.orgId },
    { ...analysis, model: (await import('../config/env.js')).env.gemini.model, generatedBy: req.user._id, organization: req.orgId, lead: lead._id },
    { upsert: true, new: true }
  );

  return sendSuccess(res, { data: { analysis, score: { score, category, breakdown } } });
});

// ── Get lead analysis ──
export const getLeadAnalysis = asyncHandler(async (req, res) => {
  const analysis = await AIAnalysis.findOne({ lead: req.params.id, organization: req.orgId }).sort('-createdAt').lean();
  return sendSuccess(res, { data: analysis });
});
