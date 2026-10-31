import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

contactSchema.index({ organization: 1, email: 1 });
contactSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});
contactSchema.set('toJSON', { virtuals: true });

export const Contact = mongoose.model('Contact', contactSchema);
