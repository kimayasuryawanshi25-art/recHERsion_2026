import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, isNull, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { appointmentDebriefs, followupTasks, auditEvents } from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';
import {
  CreateDebriefSchema,
  CreateFollowupTaskSchema,
} from '@rechersion/shared';
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  completed: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

export async function debriefRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/debriefs
  app.get('/', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(appointmentDebriefs)
      .where(and(eq(appointmentDebriefs.userId, userId), isNull(appointmentDebriefs.deletedAt)))
      .orderBy(desc(appointmentDebriefs.visitDate));

    const debriefs = rows.map(r => ({
      id: r.id,
      appointmentId: r.appointmentId,
      summaryId: r.summaryId,
      doctorName: r.doctorName,
      clinic: r.clinic,
      visitDate: r.visitDate,
      discussedTopics: r.discussedTopicsEncrypted ? cryptoService.decryptField(r.discussedTopicsEncrypted) : null,
      testsOrdered: r.testsOrderedEncrypted ? cryptoService.decryptField(r.testsOrderedEncrypted) : null,
      prescriptionsChanged: r.prescriptionsChangedEncrypted ? cryptoService.decryptField(r.prescriptionsChangedEncrypted) : null,
      notes: r.notesEncrypted ? cryptoService.decryptField(r.notesEncrypted) : null,
      followupDate: r.followupDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { debriefs };
  });

  // POST /api/v1/debriefs
  app.post('/', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateDebriefSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid debrief input',
        issues: parse.error.issues,
      });
    }

    const userId = request.user!.id;
    const data = parse.data;
    const debriefId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(appointmentDebriefs).values({
      id: debriefId,
      userId,
      appointmentId: data.appointmentId ?? null,
      summaryId: data.summaryId ?? null,
      doctorName: data.doctorName ?? null,
      clinic: data.clinic ?? null,
      visitDate: data.visitDate,
      discussedTopicsEncrypted: cryptoService.encryptField(data.discussedTopics),
      testsOrderedEncrypted: cryptoService.encryptField(data.testsOrdered),
      prescriptionsChangedEncrypted: cryptoService.encryptField(data.prescriptionsChanged),
      notesEncrypted: cryptoService.encryptField(data.notes),
      followupDate: data.followupDate ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    // Create any associated follow-up tasks
    if (data.tasks && data.tasks.length > 0) {
      for (const t of data.tasks) {
        await db.insert(followupTasks).values({
          id: crypto.randomUUID(),
          userId,
          debriefId,
          title: t.title,
          category: t.category,
          dueDate: t.dueDate ?? null,
          completed: 0,
          notesEncrypted: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          clientUpdatedAt: now,
        });
      }
    }

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'appointment_debrief_created',
      entityType: 'appointment_debriefs',
      entityId: debriefId,
      timestamp: now,
    });

    return reply.status(201).send({
      debrief: {
        id: debriefId,
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  // GET /api/v1/debriefs/tasks
  app.get('/tasks', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const { completed } = request.query as { completed?: string };

    let conditions = and(eq(followupTasks.userId, userId), isNull(followupTasks.deletedAt));
    if (completed !== undefined) {
      const isComp = completed === 'true' || completed === '1' ? 1 : 0;
      conditions = and(conditions, eq(followupTasks.completed, isComp));
    }

    const rows = await db
      .select()
      .from(followupTasks)
      .where(conditions)
      .orderBy(desc(followupTasks.dueDate));

    const tasks = rows.map(r => ({
      id: r.id,
      debriefId: r.debriefId,
      title: r.title,
      category: r.category,
      dueDate: r.dueDate,
      completed: Boolean(r.completed),
      notes: r.notesEncrypted ? cryptoService.decryptField(r.notesEncrypted) : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { tasks };
  });

  // POST /api/v1/debriefs/tasks
  app.post('/tasks', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateFollowupTaskSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid task input',
        issues: parse.error.issues,
      });
    }

    const userId = request.user!.id;
    const data = parse.data;
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(followupTasks).values({
      id: taskId,
      userId,
      debriefId: data.debriefId ?? null,
      title: data.title,
      category: data.category,
      dueDate: data.dueDate ?? null,
      completed: 0,
      notesEncrypted: cryptoService.encryptField(data.notes),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    return reply.status(201).send({
      task: {
        id: taskId,
        ...data,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  // PATCH /api/v1/debriefs/tasks/:id
  app.patch('/tasks/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parse = UpdateTaskSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid update payload' });
    }

    const userId = request.user!.id;
    const now = new Date().toISOString();
    const data = parse.data;

    const updateVals: Record<string, any> = { updatedAt: now, clientUpdatedAt: now };
    if (data.completed !== undefined) updateVals.completed = data.completed ? 1 : 0;
    if (data.dueDate !== undefined) updateVals.dueDate = data.dueDate;
    if (data.notes !== undefined) updateVals.notesEncrypted = cryptoService.encryptField(data.notes);

    await db
      .update(followupTasks)
      .set(updateVals)
      .where(and(eq(followupTasks.id, id), eq(followupTasks.userId, userId)));

    return reply.status(200).send({ success: true, id });
  });

  // DELETE /api/v1/debriefs/tasks/:id
  app.delete('/tasks/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const now = new Date().toISOString();

    await db
      .update(followupTasks)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(and(eq(followupTasks.id, id), eq(followupTasks.userId, userId)));

    return reply.status(200).send({ success: true, id });
  });
}
