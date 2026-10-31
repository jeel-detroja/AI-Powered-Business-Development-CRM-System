import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'test_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'dev_cookie_secret',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001',
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '30000', 10),
    get enabled() {
      return Boolean((process.env.GEMINI_API_KEY || '').trim());
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
    aiMax: parseInt(process.env.AI_RATE_LIMIT_MAX || '40', 10),
  },
};

export function validateEnv() {
  if (env.isTest) return;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[config] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
