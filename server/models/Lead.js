import mongoose from 'mongoose';
import { LEAD_STATUS, LEAD_SOURCES, LEAD_PRIORITY, LEAD_CATEGORY } from '../constants/index.js';

const scoreBreakdownSchema = new mongoose.Schema(
  { label: String, points: Number, max: Number, reason: String },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    jobTitle: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    source: { type: String, enum: LEAD_SOURCES, default: 'Other' },
    status: { type: String, enum: LEAD_STATUS, default: 'New', index: true },
    priority: { type: String, enum: LEAD_PRIORITY, default: 'Medium', index: true },
    estimatedBudget: { type: Number, default: 0, min: 0 },
    requirements: { type: String, default: '' },
    interestedIn: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    notes: { type: String, default: '' },
    tags: [{ type: String, trim: true }],

    // Scoring (backend-owned; AI contributes qualitative input only)
    score: { type: Number, default: 0, min: 0, max: 100, index: true },
    category: { type: String, enum: Object.values(LEAD_CATEGORY), default: LEAD_CATEGORY.COLD },
    scoreBreakdown: [scoreBreakdownSchema],
    scoredAt: { type: Date },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

leadSchema.index({ organization: 1, status: 1 });
leadSchema.index({ organization: 1, assignedTo: 1 });
leadSchema.index({ organization: 1, email: 1 });
leadSchema.index({ firstName: 'text', lastName: 'text', companyName: 'text', email: 'text' });

leadSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});
leadSchema.set('toJSON', { virtuals: true });

export const Lead = mongoose.model('Lead', leadSchema);
