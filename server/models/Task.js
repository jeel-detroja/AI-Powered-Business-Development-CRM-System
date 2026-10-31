import mongoose from 'mongoose';
import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

const taskSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TASK_STATUS, default: 'To Do', index: true },
    priority: { type: String, enum: TASK_PRIORITY, default: 'Medium' },
    dueDate: { type: Date, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedType: { type: String, enum: ['Lead', 'Contact', 'Company', 'Deal', null], default: null },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ organization: 1, status: 1 });

export const Task = mongoose.model('Task', taskSchema);
