import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    annualRevenueRange: { type: String, trim: true, default: '' },
    businessType: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

companySchema.index({ organization: 1, name: 1 });
companySchema.index({ name: 'text', industry: 'text', location: 'text' });

export const Company = mongoose.model('Company', companySchema);
