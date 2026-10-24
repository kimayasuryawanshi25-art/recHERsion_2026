import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userProfiles, auditEvents } from '../db/schema.js';
import crypto from 'node:crypto';

const UpdateProfileSchema = z.object({
  displayName: z.string().nullable().optional(),
  selectedContexts: z.array(z.string()).optional(),
  discreetMode: z.boolean().optional(),
  onboardingComplete: z.boolean().optional(),
}).strict();

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  // GET /profile
  app.get('/profile', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!profile) {
      return reply.status(404).send({ error: 'Not Found', message: 'Profile not found' });
    }

    return {
      profile: {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        selectedContexts: profile.selectedContexts ? JSON.parse(profile.selectedContexts) : [],
        discreetMode: Boolean(profile.discreetMode),
        onboardingComplete: Boolean(profile.onboardingComplete),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    };
  });

  // PUT /profile
  app.put('/profile', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateProfileSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid profile data or unknown fields provided.',
      });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const now = new Date().toISOString();

    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Profile not found' });
    }

    const updateValues: Record<string, any> = {
      updatedAt: now,
    };

    if (data.displayName !== undefined) updateValues.displayName = data.displayName;
    if (data.selectedContexts !== undefined) updateValues.selectedContexts = JSON.stringify(data.selectedContexts);
    if (data.discreetMode !== undefined) updateValues.discreetMode = data.discreetMode ? 1 : 0;
    if (data.onboardingComplete !== undefined) updateValues.onboardingComplete = data.onboardingComplete ? 1 : 0;

    await db.update(userProfiles).set(updateValues).where(eq(userProfiles.userId, userId));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'profile_updated',
      entityType: 'user_profiles',
      entityId: existing.id,
      timestamp: now,
    });

    const updated = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return {
      profile: {
        id: updated!.id,
        userId: updated!.userId,
        displayName: updated!.displayName,
        selectedContexts: updated!.selectedContexts ? JSON.parse(updated!.selectedContexts) : [],
        discreetMode: Boolean(updated!.discreetMode),
        onboardingComplete: Boolean(updated!.onboardingComplete),
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      },
    };
  });
}
