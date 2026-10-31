import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export function notFound(req, res) {
  return sendError(res, { status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return sendError(res, {
      status: 400,
      message: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err?.code === 11000) {
    return sendError(res, { status: 409, message: 'Duplicate value', details: err.keyValue });
  }
  if (err?.name === 'ValidationError') {
    return sendError(res, { status: 400, message: err.message });
  }
  if (err?.name === 'CastError') {
    return sendError(res, { status: 400, message: `Invalid ${err.path}` });
  }
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return sendError(res, { status: 401, message: 'Invalid or expired token' });
  }
  const status = err.statusCode || 500;
  if (status >= 500 && !env.isTest) console.error('[error]', err);
  return sendError(res, {
    status,
    message: err.isOperational || !env.isProd ? err.message : 'Internal server error',
    details: err.details || null,
  });
}
