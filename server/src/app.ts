import fastify, { type FastifyInstance } from 'fastify';
import { registerSecurityPlugins } from './plugins/security.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { initDatabase } from './db/index.js';

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

  return app;
}
