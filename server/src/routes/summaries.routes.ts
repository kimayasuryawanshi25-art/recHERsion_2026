import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  assembleConsultationSummary,
  getSummaryById,
  updateSummary,
} from '../services/summary.service.js';
import { generateConsultationSummaryPdf } from '../services/pdf.service.js';
import {
  SummaryInterviewInputSchema,
  UpdateSummaryInputSchema,
} from '@rechersion/shared';

export async function summariesRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/summaries/interview - assemble summary from 6 questions + records
  app.post('/interview', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = SummaryInterviewInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid interview inputs',
        issues: parseResult.error.issues,
      });
    }

    try {
      const summary = await assembleConsultationSummary(request.user!.id, parseResult.data);
      return reply.status(201).send(summary);
    } catch (err: any) {
      return reply.status(400).send({
        error: 'Summary Assembly Error',
        message: err.message || 'Failed to assemble summary',
      });
    }
  });

  // GET /api/v1/summaries/:id - fetch existing summary
  app.get('/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const summary = await getSummaryById(request.user!.id, id);
    if (!summary) {
      return reply.status(404).send({ error: 'Not Found', message: 'Summary not found' });
    }
    return reply.send(summary);
  });

  // PUT /api/v1/summaries/:id - update summary or sections
  app.put('/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = UpdateSummaryInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid summary update payload',
        issues: parseResult.error.issues,
      });
    }

    try {
      const updated = await updateSummary(request.user!.id, id, parseResult.data);
      if (!updated) {
        return reply.status(404).send({ error: 'Not Found', message: 'Summary not found' });
      }
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({
        error: 'Update Error',
        message: err.message || 'Failed to update summary',
      });
    }
  });

  // POST /api/v1/summaries/:id/pdf - generate and download PDF
  app.post('/:id/pdf', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const summary = await getSummaryById(request.user!.id, id);
    if (!summary) {
      return reply.status(404).send({ error: 'Not Found', message: 'Summary not found' });
    }

    try {
      const pdfBuffer = await generateConsultationSummaryPdf(summary);
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="appointment-summary-${summary.id.slice(0, 8)}.pdf"`)
        .header('Content-Length', pdfBuffer.length)
        .send(pdfBuffer);
    } catch (err: any) {
      return reply.status(500).send({
        error: 'PDF Generation Failed',
        message: err.message || 'Unable to generate PDF document',
      });
    }
  });
}
