import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

validateEnv();

try {
  await connectDB();
} catch {
  process.exit(1);
}

createApp().listen(env.port, () => {
  console.log(`[server] Nexora CRM API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});
