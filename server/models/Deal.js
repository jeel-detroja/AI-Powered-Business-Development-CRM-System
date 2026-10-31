import mongoose from 'mongoose';
import { DEAL_STAGES, LEAD_PRIORITY } from '../constants/index.js';

const stageHistorySchema = new mongoose.Schema(
  {
    stage: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    value: { type: Number, default: 0, min: 0 },
    stage: { type: String, enum: DEAL_STAGES, default: 'Qualification', index: true },
    probability: { type: Number, default: 10, min: 0, max: 100 },
    priority: { type: String, enum: LEAD_PRIORITY, default: 'Medium' },
    expectedCloseDate: { type: Date },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
    stageHistory: [stageHistorySchema],
    closedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

dealSchema.index({ organization: 1, stage: 1 });
dealSchema.index({ organization: 1, owner: 1 });

export const Deal = mongoose.model('Deal', dealSchema);
