import mongoose from 'mongoose';
import { ACTIVITY_TYPES, LEAD_PRIORITY } from '../constants/index.js';

const activitySchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, default: 'Follow-up' },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueAt: { type: Date, index: true },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false, index: true },
    priority: { type: String, enum: LEAD_PRIORITY, default: 'Medium' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

activitySchema.index({ organization: 1, dueAt: 1, isCompleted: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
