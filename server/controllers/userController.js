import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { User } from '../models/index.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { organization: req.orgId };

  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(filter).sort('firstName').skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: users, meta: buildMeta({ page, limit, total }) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organization: req.orgId });
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, { data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const schema = z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
    avatarColor: z.string().trim().optional(),
  });

  const body = schema.parse(req.body);

  // Users can update their own profile; admins can update any user in org
  if (req.user.role !== 'admin' && String(req.user._id) !== req.params.id) {
    throw ApiError.forbidden('You do not have permission to update this user');
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId },
    body,
    { new: true, runValidators: true }
  );

  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, { message: 'User updated', data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const schema = z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
  });

  const body = schema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.user._id, body, { new: true, runValidators: true });
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await User.findOne({ _id: req.params.id, organization: req.orgId });
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = !user.isActive;
  await user.save();

  return sendSuccess(res, {
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    data: user,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, { message: 'Password updated successfully' });
});
