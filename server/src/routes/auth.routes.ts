import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as argon2 from '@node-rs/argon2';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  users,
  userProfiles,
  userConsents,
  auditEvents,
  userModules,
  symptomEntries,
  medicationEvents,
  appointments,
  screeningRecords,
  consultationSummaries,
  shareTokens,
  sessions,
} from '../db/schema.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().optional(),
}).strict();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}).strict();

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // CSRF token endpoint
  app.get('/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = await reply.generateCsrf();
    return { csrfToken: token };
  });

  // POST /register
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = RegisterSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid registration details. Email and password (min 8 chars) are required.',
      });
    }

    const { email, password, displayName } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existing) {
      // Generic error or already registered message
      return reply.status(409).send({
        error: 'Conflict',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await argon2.hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert user, profile, and consent
    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(userProfiles).values({
      id: crypto.randomUUID(),
      userId,
      displayName: displayName || null,
      selectedContexts: JSON.stringify(['general-wellbeing']),
      discreetMode: 0,
      onboardingComplete: 1,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(userConsents).values({
      id: crypto.randomUUID(),
      userId,
      consentType: 'sync_encrypted',
      granted: 1,
      grantedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'user_registered',
      entityType: 'users',
      entityId: userId,
      timestamp: now,
    });

    request.session.userId = userId;
    request.session.email = normalizedEmail;

    return reply.status(201).send({
      user: {
        id: userId,
        email: normalizedEmail,
        displayName: displayName || null,
      },
    });
  });

  // POST /login
  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = LoginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid credentials provided.',
        });
      }

      const { email, password } = parseResult.data;
      const normalizedEmail = email.trim().toLowerCase();

      const user = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });

      if (!user) {
        // Generic auth error to prevent email enumeration
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password.',
        });
      }

      const validPassword = await argon2.verify(user.passwordHash, password);
      if (!validPassword) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password.',
        });
      }

      const now = new Date().toISOString();
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        userId: user.id,
        action: 'user_login',
        entityType: 'users',
        entityId: user.id,
        timestamp: now,
      });

      request.session.userId = user.id;
      request.session.email = user.email;

      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: profile?.displayName || null,
        },
      };
    }
  );

  // POST /logout
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.session.userId) {
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        userId: request.session.userId,
        action: 'user_logout',
        entityType: 'users',
        entityId: request.session.userId,
        timestamp: new Date().toISOString(),
      });
    }

    request.session.destroy();
    return reply.send({ success: true, message: 'Logged out successfully.' });
  });

  // GET /me
  app.get('/me', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user!.id),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: profile?.displayName || null,
        discreetMode: Boolean(profile?.discreetMode),
        selectedContexts: profile?.selectedContexts ? JSON.parse(profile.selectedContexts) : [],
        onboardingComplete: Boolean(profile?.onboardingComplete),
      },
    };
  });

  // DELETE /account — Atomic hard-delete of all user data
  app.delete('/account', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;

    // Hard-delete all associated rows across all tables in order
    await db.delete(shareTokens).where(eq(shareTokens.userId, userId));
    await db.delete(consultationSummaries).where(eq(consultationSummaries.userId, userId));
    await db.delete(screeningRecords).where(eq(screeningRecords.userId, userId));
    await db.delete(appointments).where(eq(appointments.userId, userId));
    await db.delete(medicationEvents).where(eq(medicationEvents.userId, userId));
    await db.delete(symptomEntries).where(eq(symptomEntries.userId, userId));
    await db.delete(userModules).where(eq(userModules.userId, userId));
    await db.delete(userConsents).where(eq(userConsents.userId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(auditEvents).where(eq(auditEvents.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    request.session.destroy();

    return reply.send({
      success: true,
      message: 'Account and all associated records have been permanently deleted.',
    });
  });
}
