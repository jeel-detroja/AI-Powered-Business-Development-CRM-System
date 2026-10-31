import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { Activity } from '../models/index.js';
import { ACTIVITY_TYPES, LEAD_PRIORITY } from '../constants/index.js';

const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES).optional().default('Follow-up'),
  subject: z.string().trim().min(1),
  description: z.string().optional().default(''),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(LEAD_PRIORITY).optional().default('Medium'),
  lead: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  deal: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const getActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['dueAt', 'createdAt', 'type', 'subject'], '-dueAt');
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.type) filter.type = req.query.type;
  if (req.query.isCompleted === 'true') filter.isCompleted = true;
  if (req.query.isCompleted === 'false') filter.isCompleted = false;
  if (req.query.lead) filter.lead = req.query.lead;
  if (req.query.contact) filter.contact = req.query.contact;
  if (req.query.deal) filter.deal = req.query.deal;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  // Overdue filter
  if (req.query.overdue === 'true') {
    filter.isCompleted = false;
    filter.dueAt = { $lt: new Date() };
  }
  // Upcoming filter
  if (req.query.upcoming === 'true') {
    filter.isCompleted = false;
    filter.dueAt = { $gte: new Date() };
  }

  if (req.user.role === 'rep') filter.assignedTo = req.user._id;

  const [activities, total] = await Promise.all([
    Activity.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('lead', 'firstName lastName')
      .populate('contact', 'firstName lastName')
      .populate('company', 'name')
      .populate('deal', 'title')
      .populate('assignedTo', 'firstName lastName avatarColor')
      .lean(),
    Activity.countDocuments(filter),
  ]);
  return sendSuccess(res, { data: activities, meta: buildMeta({ page, limit, total }) });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('lead', 'firstName lastName email')
    .populate('contact', 'firstName lastName email')
    .populate('company', 'name')
    .populate('deal', 'title value stage')
    .populate('assignedTo', 'firstName lastName email avatarColor');
  if (!activity) throw ApiError.notFound('Activity not found');
  return sendSuccess(res, { data: activity });
});

export const createActivity = asyncHandler(async (req, res) => {
  const body = activitySchema.parse(req.body);
  const activity = await Activity.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    assignedTo: body.assignedTo || req.user._id,
  });
  return sendSuccess(res, { status: 201, message: 'Activity created', data: activity });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const body = activitySchema.partial().parse(req.body);
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    body,
    { new: true, runValidators: true }
  );
  if (!activity) throw ApiError.notFound('Activity not found');
  return sendSuccess(res, { message: 'Activity updated', data: activity });
});

export const completeActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!activity) throw ApiError.notFound('Activity not found');
  activity.isCompleted = true;
  activity.completedAt = new Date();
  await activity.save();
  return sendSuccess(res, { message: 'Activity completed', data: activity });
});

export const rescheduleActivity = asyncHandler(async (req, res) => {
  const { dueAt } = z.object({ dueAt: z.string().datetime() }).parse(req.body);
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { dueAt, isCompleted: false, completedAt: null },
    { new: true }
  );
  if (!activity) throw ApiError.notFound('Activity not found');
  return sendSuccess(res, { message: 'Activity rescheduled', data: activity });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!activity) throw ApiError.notFound('Activity not found');
  return sendSuccess(res, { message: 'Activity deleted' });
});
