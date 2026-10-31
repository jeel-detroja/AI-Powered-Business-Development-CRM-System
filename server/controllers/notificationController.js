import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { Notification } from '../models/index.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {
    organization: req.orgId,
    user: req.user._id,
  };

  if (req.query.isRead === 'true') filter.isRead = true;
  if (req.query.isRead === 'false') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ organization: req.orgId, user: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    data: notifications,
    meta: { ...buildMeta({ page, limit, total }), unreadCount },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { message: 'Notification marked as read', data: notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { organization: req.orgId, user: req.user._id, isRead: false },
    { isRead: true }
  );
  return sendSuccess(res, { message: `${result.modifiedCount} notifications marked as read`, data: { modified: result.modifiedCount } });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    organization: req.orgId,
    user: req.user._id,
  });
  if (!notification) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { message: 'Notification deleted' });
});
