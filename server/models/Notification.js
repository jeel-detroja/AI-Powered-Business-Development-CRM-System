import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/index.js';

const notificationSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ organization: 1, user: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
