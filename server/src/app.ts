import fastify, { type FastifyInstance } from 'fastify';
import { registerSecurityPlugins } from './plugins/security.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { initDatabase } from './db/index.js';

import { profileRoutes } from './routes/profile.routes.js';
import { moduleRoutes } from './routes/modules.routes.js';
import { entriesRoutes } from './routes/entries.routes.js';
import { clinicalRoutes } from './routes/clinical.routes.js';
import { observationsRoutes } from './routes/observations.routes.js';

import { screeningTimelineRoutes } from './routes/screening-timeline.routes.js';
import { summariesRoutes } from './routes/summaries.routes.js';
import { transitionsRoutes } from './routes/transitions.routes.js';
import { syncRoutes } from './routes/sync.routes.js';
import { shareRoutes } from './routes/share.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { navigatorRoutes } from './routes/navigator.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
    trustProxy: true,
  });

  // Initialize DB tables
  await initDatabase();

  // Security, sessions, csrf, cors, rate limits
  await registerSecurityPlugins(app);

  // Register routes under /api/v1
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(profileRoutes, { prefix: '/api/v1' });
  await app.register(moduleRoutes, { prefix: '/api/v1' });
  await app.register(entriesRoutes, { prefix: '/api/v1' });
  await app.register(clinicalRoutes, { prefix: '/api/v1' });
  await app.register(observationsRoutes, { prefix: '/api/v1' });
  await app.register(screeningTimelineRoutes, { prefix: '/api/v1' });
  await app.register(summariesRoutes, { prefix: '/api/v1/summaries' });
  await app.register(transitionsRoutes, { prefix: '/api/v1/transitions' });
  await app.register(syncRoutes, { prefix: '/api/v1/sync' });
  await app.register(shareRoutes, { prefix: '/api/v1/share' });
  await app.register(aiRoutes, { prefix: '/api/v1/ai' });
  await app.register(navigatorRoutes, { prefix: '/api/v1/navigator' });

  return app;
}
