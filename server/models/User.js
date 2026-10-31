import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ROLES } from '../constants/index.js';

const userSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.REP, index: true },
    phone: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    avatarColor: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ organization: 1, email: 1 }, { unique: true });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  return raw;
};

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
