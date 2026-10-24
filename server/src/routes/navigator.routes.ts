import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CareNavigatorInputsSchema, assessCareLevel } from '@rechersion/shared';
import { db } from '../db/index.js';
import { auditEvents } from '../db/schema.js';
import crypto from 'node:crypto';

export async function navigatorRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/navigator/assess
  app.post('/assess', async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CareNavigatorInputsSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid care navigator inputs',
        issues: parse.error.issues,
      });
    }

    const assessment = assessCareLevel(parse.data);

    // If user is authenticated, log non-health audit event
    const userId = request.session?.userId || (request as any).user?.id;
    if (userId) {
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        userId,
        action: 'care_navigator_assessed',
        entityType: 'care_navigator',
        entityId: assessment.careLevel,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.status(200).send({ assessment });
  });
}
