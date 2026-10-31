import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: Object },
    ip: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
