import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), org: String(user.organization), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
