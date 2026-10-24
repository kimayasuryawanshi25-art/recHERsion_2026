import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { shareTokens, consultationSummaries, auditEvents } from '../db/schema.js';

const CreateShareSchema = z.object({
  summaryId: z.string(),
  expiryDays: z.number().int().min(1).max(30).default(7),
  maxViews: z.number().int().min(1).max(100).default(5),
}).strict();

export async function shareRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/share - Create secure share token
  app.post('/', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateShareSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid share link parameters',
        issues: parseResult.error.issues,
      });
    }

    const userId = request.user!.id;
    const { summaryId, expiryDays, maxViews } = parseResult.data;

    // Verify summary exists and belongs to user
    const [summary] = await db
      .select()
      .from(consultationSummaries)
      .where(and(eq(consultationSummaries.id, summaryId), eq(consultationSummaries.userId, userId)));

    if (!summary) {
      return reply.status(404).send({ error: 'Not Found', message: 'Consultation summary not found' });
    }

    // Generate 32-byte cryptographically random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
    const shareId = crypto.randomUUID();

    await db.insert(shareTokens).values({
      id: shareId,
      userId,
      summaryId,
      tokenHash,
      scope: 'read_summary',
      expiresAt,
      maxViews,
      viewCount: 0,
      revokedAt: null,
      createdAt: now.toISOString(),
    });

    // Non-negotiable rule 6: Never log health content
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'share_token_created',
      entityType: 'share_token',
      entityId: shareId,
      timestamp: now.toISOString(),
    });

    return reply.status(201).send({
      id: shareId,
      summaryId,
      rawToken, // Returned once to creator
      expiresAt,
      maxViews,
      viewCount: 0,
    });
  });

  // GET /api/v1/share - List share tokens for user
  app.get('/', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const tokens = await db
      .select({
        id: shareTokens.id,
        summaryId: shareTokens.summaryId,
        expiresAt: shareTokens.expiresAt,
        maxViews: shareTokens.maxViews,
        viewCount: shareTokens.viewCount,
        revokedAt: shareTokens.revokedAt,
        createdAt: shareTokens.createdAt,
      })
      .from(shareTokens)
      .where(eq(shareTokens.userId, userId));

    return { shareTokens: tokens };
  });

  // DELETE /api/v1/share/:id - Revoke share token
  app.delete('/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };

    const [existing] = await db
      .select()
      .from(shareTokens)
      .where(and(eq(shareTokens.id, id), eq(shareTokens.userId, userId)));

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Share token not found' });
    }

    const now = new Date().toISOString();
    await db
      .update(shareTokens)
      .set({ revokedAt: now })
      .where(eq(shareTokens.id, id));

    // Audit log
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'share_token_revoked',
      entityType: 'share_token',
      entityId: id,
      timestamp: now,
    });

    return reply.send({ success: true, message: 'Share link revoked successfully' });
  });

  // GET /api/v1/share/public/:token - Public read-only access (No auth required)
  app.get('/public/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as { token: string };

    if (!token || token.length !== 64) {
      return reply.status(404).send({ error: 'Not Found', message: 'Invalid or expired share link' });
    }

    // Set anti-indexing headers
    reply.header('X-Robots-Tag', 'noindex, nofollow, noarchive');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [share] = await db
      .select()
      .from(shareTokens)
      .where(eq(shareTokens.tokenHash, tokenHash));

    if (!share) {
      return reply.status(404).send({ error: 'Not Found', message: 'Invalid or expired share link' });
    }

    // Validate active status
    if (share.revokedAt) {
      return reply.status(410).send({ error: 'Gone', message: 'This share link has been revoked by the creator' });
    }

    const now = new Date().toISOString();
    if (now > share.expiresAt) {
      return reply.status(410).send({ error: 'Gone', message: 'This share link has expired' });
    }

    if (share.viewCount >= share.maxViews) {
      return reply.status(410).send({ error: 'Gone', message: 'This share link has reached its maximum view limit' });
    }

    // Fetch summary
    const [summary] = await db
      .select()
      .from(consultationSummaries)
      .where(eq(consultationSummaries.id, share.summaryId));

    if (!summary || summary.deletedAt) {
      return reply.status(404).send({ error: 'Not Found', message: 'Summary is no longer available' });
    }

    // Increment view count
    await db
      .update(shareTokens)
      .set({ viewCount: share.viewCount + 1 })
      .where(eq(shareTokens.id, share.id));

    let sections: any[] = [];
    try {
      sections = JSON.parse(summary.sections);
    } catch {
      sections = [];
    }

    return reply.send({
      summary: {
        id: summary.id,
        whatChanged: summary.whatChanged,
        mainConcerns: summary.mainConcerns,
        firstNoticed: summary.firstNoticed,
        dailyImpact: summary.dailyImpact,
        relevantRecords: summary.relevantRecords,
        questionsForDoctor: summary.questionsForDoctor,
        sections: sections.filter(s => s.enabled),
        generatedText: summary.generatedText,
        editedText: summary.editedText,
        createdAt: summary.createdAt,
      },
      shareInfo: {
        viewsRemaining: share.maxViews - (share.viewCount + 1),
        expiresAt: share.expiresAt,
      },
    });
  });
}
