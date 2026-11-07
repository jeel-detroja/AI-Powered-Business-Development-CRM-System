import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    settings: {
      aiEnabled: { type: Boolean, default: true },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model('Organization', organizationSchema);
