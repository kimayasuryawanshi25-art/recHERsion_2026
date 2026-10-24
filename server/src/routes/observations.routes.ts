import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { rulesService } from '../services/rules.service.js';

export async function observationsRoutes(app: FastifyInstance): Promise<void> {
  // GET /observations?from=...&to=... — Computes observations on demand
  app.get('/observations', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const query = request.query as { from?: string; to?: string };

    const observations = await rulesService.computeObservations(userId, query.from, query.to);
    return { observations };
  });

  // GET /observations/:id/evidence — Returns exact supporting entries
  app.get('/observations/:id/evidence', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };
    const query = request.query as { from?: string; to?: string };

    const evidence = await rulesService.getObservationEvidence(userId, id, query.from, query.to);
    if (!evidence) {
      return reply.status(404).send({ error: 'Not Found', message: 'Observation evidence not found' });
    }

    return { evidence };
  });

  // GET /rules — Returns rule catalog from database registry
  app.get('/rules', async () => {
    const rows = await db.query.rulesRegistry.findMany();
    return {
      rules: rows.map(r => ({
        ruleId: r.ruleId,
        version: r.version,
        status: r.status,
        title: r.title,
        minEntries: r.minEntries,
        requiredInputs: JSON.parse(r.requiredInputs || '[]'),
        updatedAt: r.updatedAt,
      })),
    };
  });
}
