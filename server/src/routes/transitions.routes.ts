import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  suggestLifeStageTransition,
  applyLifeStageTransition,
} from '../services/transition.service.js';
import {
  TransitionSuggestInputSchema,
  TransitionApplyInputSchema,
} from '@rechersion/shared';

export async function transitionsRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/transitions/suggest - suggest modules, screenings, questions for stage transition
  app.post('/suggest', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = TransitionSuggestInputSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid transition suggestion input',
        issues: parseResult.error.issues,
      });
    }

    const suggestion = await suggestLifeStageTransition(request.user!.id, parseResult.data);
    return reply.send(suggestion);
  });

  // POST /api/v1/transitions - execute transition changes to active modules
  app.post('/', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = TransitionApplyInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid transition execution payload',
        issues: parseResult.error.issues,
      });
    }

    const result = await applyLifeStageTransition(request.user!.id, parseResult.data);
    return reply.send(result);
  });
}
