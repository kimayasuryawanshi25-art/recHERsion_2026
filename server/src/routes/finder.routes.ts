import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  VERIFIED_PROVIDERS,
  VERIFIED_HELPLINES,
  ProviderFilterSchema,
} from '@rechersion/shared';

export async function finderRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/finder/helplines
  app.get('/helplines', async (request: FastifyRequest, reply: FastifyReply) => {
    const { category } = request.query as { category?: string };

    let helplines = VERIFIED_HELPLINES;
    if (category) {
      helplines = helplines.filter(h => h.category === category);
    }

    return reply.status(200).send({ helplines });
  });

  // GET /api/v1/finder/providers
  app.get('/providers', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, any>;
    const filterInput = {
      type: query.type || undefined,
      costModel: query.costModel || undefined,
      genderAffirming: query.genderAffirming !== undefined ? query.genderAffirming === 'true' || query.genderAffirming === true : undefined,
      suburb: query.suburb || undefined,
      state: query.state || undefined,
      accessibility: query.accessibility || undefined,
    };

    const parse = ProviderFilterSchema.safeParse(filterInput);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid filter parameters',
        issues: parse.error.issues,
      });
    }

    const filter = parse.data;
    let results = [...VERIFIED_PROVIDERS];

    if (filter.type) {
      results = results.filter(p => p.type === filter.type);
    }

    if (filter.costModel) {
      results = results.filter(p => p.costModel === filter.costModel);
    }

    if (filter.genderAffirming !== undefined) {
      results = results.filter(p => p.genderAffirming === filter.genderAffirming);
    }

    if (filter.state) {
      results = results.filter(p => p.state.toLowerCase() === filter.state!.toLowerCase());
    }

    if (filter.suburb) {
      results = results.filter(p => p.suburb.toLowerCase().includes(filter.suburb!.toLowerCase()));
    }

    if (filter.accessibility) {
      results = results.filter(p => p.accessibility.includes(filter.accessibility!));
    }

    const search = (query.search || '').trim().toLowerCase();
    if (search) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.suburb.toLowerCase().includes(search) ||
        p.address.toLowerCase().includes(search)
      );
    }

    return reply.status(200).send({ providers: results });
  });
}
