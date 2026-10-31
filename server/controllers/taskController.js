import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { Task } from '../models/index.js';
import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

const taskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().default(''),
  status: z.enum(TASK_STATUS).optional().default('To Do'),
  priority: z.enum(TASK_PRIORITY).optional().default('Medium'),
  dueDate: z.string().datetime().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  relatedType: z.enum(['Lead', 'Contact', 'Company', 'Deal']).optional().nullable(),
  relatedId: z.string().optional().nullable(),
});

export const getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['title', 'dueDate', 'createdAt', 'status', 'priority'], '-createdAt');
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.relatedType) filter.relatedType = req.query.relatedType;

  // Overdue filter
  if (req.query.overdue === 'true') {
    filter.status = { $ne: 'Completed' };
    filter.dueDate = { $lt: new Date() };
  }

  // Due today filter
  if (req.query.today === 'true') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    filter.dueDate = { $gte: start, $lte: end };
    filter.status = { $ne: 'Completed' };
  }

  // Role-based: reps see only their own tasks
  if (req.user.role === 'rep') {
    filter.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('assignedTo', 'firstName lastName avatarColor')
      .populate('createdBy', 'firstName lastName')
      .lean(),
    Task.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: tasks, meta: buildMeta({ page, limit, total }) });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('assignedTo', 'firstName lastName email avatarColor')
    .populate('createdBy', 'firstName lastName');
  if (!task) throw ApiError.notFound('Task not found');
  return sendSuccess(res, { data: task });
});

export const createTask = asyncHandler(async (req, res) => {
  const body = taskSchema.parse(req.body);
  const task = await Task.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    assignedTo: body.assignedTo || req.user._id,
  });
  return sendSuccess(res, { status: 201, message: 'Task created', data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const body = taskSchema.partial().parse(req.body);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    body,
    { new: true, runValidators: true }
  );
  if (!task) throw ApiError.notFound('Task not found');
  return sendSuccess(res, { message: 'Task updated', data: task });
});

export const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } });
  if (!task) throw ApiError.notFound('Task not found');
  task.status = 'Completed';
  task.completedAt = new Date();
  await task.save();
  return sendSuccess(res, { message: 'Task completed', data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!task) throw ApiError.notFound('Task not found');
  return sendSuccess(res, { message: 'Task deleted' });
});
