import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  draftAiSummary,
  getUserConsents,
  setUserConsent,
  ConsentRequiredError,
} from '../services/ai.service.js';

const DraftAiSummarySchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1, 'At least one entryId is required'),
  promptContext: z.string().max(1000).optional(),
}).strict();

const UpdateConsentSchema = z.object({
  consentType: z.enum(['ai_summary', 'sync_encrypted', 'discreet_mode']),
  granted: z.boolean(),
}).strict();

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/ai/consents
  app.get('/consents', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const consents = await getUserConsents(userId);
    return { consents };
  });

  // PUT /api/v1/ai/consents
  app.put('/consents', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = UpdateConsentSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: parse.error.issues[0]?.message || 'Invalid consent payload',
      });
    }

    const userId = request.user!.id;
    await setUserConsent(userId, parse.data.consentType, parse.data.granted);

    const updated = await getUserConsents(userId);
    return { success: true, consents: updated };
  });

  // POST /api/v1/ai/draft-summary
  app.post('/draft-summary', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = DraftAiSummarySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: parse.error.issues[0]?.message || 'Invalid request body',
      });
    }

    const userId = request.user!.id;

    try {
      const result = await draftAiSummary(userId, parse.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      if (err instanceof ConsentRequiredError) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: err.message,
          code: 'CONSENT_REQUIRED',
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: err.message || 'Failed to draft summary',
      });
    }
  });
}
