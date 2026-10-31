import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    model: { type: String },
    summary: String,
    requirements: String,
    interests: String,
    opportunity: String,
    buyingIntent: String,
    challenges: String,
    strategy: String,
    nextAction: String,
    followUpMessage: String,
    qualitative: { type: Object },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
