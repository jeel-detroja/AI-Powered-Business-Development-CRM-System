import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import importRoutes from './routes/importRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || !env.isProd) {
          return callback(null, origin || true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser(env.cookieSecret));
  app.use(mongoSanitize());
  app.use(
    '/api',
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => env.isTest,
    })
  );

  // Health check
  app.get('/api/health', (_req, res) =>
    res.json({ success: true, message: 'OK', data: { status: 'up', aiEnabled: env.gemini.enabled } })
  );

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/deals', dealRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
