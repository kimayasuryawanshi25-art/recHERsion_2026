import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCsrf from '@fastify/csrf-protection';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
  interface Session {
    userId?: string;
    email?: string;
  }
}

export async function registerSecurityPlugins(app: FastifyInstance): Promise<void> {
  // 1. Security Headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Vite frontend manages CSP if needed
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // 2. CORS restricted to FRONTEND_ORIGIN
  await app.register(fastifyCors, {
    origin: [config.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token'],
  });

  // 3. Cookie Plugin
  await app.register(fastifyCookie, {
    secret: config.SESSION_SECRET,
  });

  // 4. Session Plugin
  await app.register(fastifySession, {
    secret: config.SESSION_SECRET,
    cookieName: 'herhealth_session',
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });

  // 5. CSRF Protection
  await app.register(fastifyCsrf, {
    sessionPlugin: '@fastify/session',
  });

  // 6. Rate Limiting
  await app.register(fastifyRateLimit, {
    max: 120,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  // 7. Centralized Sanitized Error Handler
  app.setErrorHandler((error, request, reply) => {
    // Log internal error safely without health content
    app.log.error({
      msg: 'Server error encountered',
      url: request.url,
      method: request.method,
      statusCode: error.statusCode || 500,
      code: error.code,
    });

    // Rate limit response
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment before trying again.',
      });
    }

    // Validation error
    if (error.validation || (error as any).issues) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid input parameters or unknown fields provided.',
      });
    }

    // Generic safe error message (no leaked database/stack info)
    const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 500;

    return reply.status(statusCode).send({
      error: statusCode === 401 ? 'Unauthorized' : statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
      message: error.statusCode && error.statusCode < 500
        ? error.message
        : 'An unexpected error occurred. Please try again.',
    });
  });

  // Decorator to require authentication
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.session?.userId;
    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in.',
      });
    }
    request.user = { id: userId, email: request.session.email || '' };
  });
}
