import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.token;
  const header = req.headers.authorization;
  if (!token && header?.startsWith('Bearer ')) token = header.slice(7);
  if (!token) throw ApiError.unauthorized('Authentication required');

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');
  req.user = user;
  req.orgId = user.organization;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};
