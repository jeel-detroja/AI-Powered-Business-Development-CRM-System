import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { signToken, cookieOptions } from '../utils/jwt.js';
import { Organization, User } from '../models/index.js';
import { ROLES } from '../constants/index.js';

const registerSchema = z.object({
  organizationName: z.string().trim().min(2),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function respondWithToken(res, user, status = 200, message = 'OK') {
  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  return sendSuccess(res, { status, message, data: { token, user } });
}

// Creates a new organization and its first admin user.
export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const existingUser = await User.findOne({ email: body.email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  const org = await Organization.create({ name: body.organizationName });
  try {
    const user = await User.create({
      organization: org._id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      role: ROLES.ADMIN,
    });
    return respondWithToken(res, user, 201, 'Registered');
  } catch (err) {
    await Organization.findByIdAndDelete(org._id);
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
  user.lastLoginAt = new Date();
  await user.save();
  return respondWithToken(res, user, 200, 'Logged in');
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', cookieOptions());
  return sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => sendSuccess(res, { data: { user: req.user } }));
