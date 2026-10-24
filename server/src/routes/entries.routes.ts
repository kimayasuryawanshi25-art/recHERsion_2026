import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull, gt } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { symptomEntries, auditEvents } from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';

const CreateEntrySchema = z.object({
  id: z.string().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  eventTime: z.string().nullable().optional(),
  symptom: z.string().min(1),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  dailyImpact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  medications: z.string().nullable().optional(),
  contexts: z.array(z.string()).default([]),
  recordedAt: z.string().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();

const UpdateEntrySchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventTime: z.string().nullable().optional(),
  symptom: z.string().min(1).optional(),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  dailyImpact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  medications: z.string().nullable().optional(),
  contexts: z.array(z.string()).optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();

export async function entriesRoutes(app: FastifyInstance): Promise<void> {
  // GET /symptom-entries — list entries
  app.get('/symptom-entries', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const query = request.query as { since?: string; includeDeleted?: string };

    let rows;
    if (query.since) {
      rows = await db.query.symptomEntries.findMany({
        where: and(
          eq(symptomEntries.userId, userId),
          gt(symptomEntries.updatedAt, query.since)
        ),
      });
    } else {
      rows = await db.query.symptomEntries.findMany({
        where: and(
          eq(symptomEntries.userId, userId),
          query.includeDeleted === 'true' ? undefined : isNull(symptomEntries.deletedAt)
        ),
      });
    }

    // Decrypt sensitive fields
    const decrypted = rows.map(r => ({
      id: r.id,
      eventDate: r.eventDate,
      eventTime: r.eventTime,
      symptom: r.symptom,
      severity: r.severity,
      mood: r.mood,
      energy: r.energy,
      sleepQuality: r.sleepQuality,
      dailyImpact: cryptoService.decryptField(r.dailyImpactEncrypted),
      notes: cryptoService.decryptField(r.notesEncrypted),
      medications: cryptoService.decryptField(r.medicationsEncrypted),
      contexts: JSON.parse(r.contexts || '[]'),
      recordedAt: r.recordedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt,
    }));

    return { entries: decrypted };
  });

  // GET /symptom-entries/:id — single entry
  app.get('/symptom-entries/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };

    const row = await db.query.symptomEntries.findFirst({
      where: and(
        eq(symptomEntries.id, id),
        eq(symptomEntries.userId, userId),
        isNull(symptomEntries.deletedAt)
      ),
    });

    if (!row) {
      return reply.status(404).send({ error: 'Not Found', message: 'Entry not found' });
    }

    return {
      entry: {
        id: row.id,
        eventDate: row.eventDate,
        eventTime: row.eventTime,
        symptom: row.symptom,
        severity: row.severity,
        mood: row.mood,
        energy: row.energy,
        sleepQuality: row.sleepQuality,
        dailyImpact: cryptoService.decryptField(row.dailyImpactEncrypted),
        notes: cryptoService.decryptField(row.notesEncrypted),
        medications: cryptoService.decryptField(row.medicationsEncrypted),
        contexts: JSON.parse(row.contexts || '[]'),
        recordedAt: row.recordedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        clientUpdatedAt: row.clientUpdatedAt,
      },
    };
  });

  // POST /symptom-entries — create entry
  app.post('/symptom-entries', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateEntrySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid entry parameters or unknown fields provided.',
      });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const now = new Date().toISOString();
    const entryId = data.id || crypto.randomUUID();

    await db.insert(symptomEntries).values({
      id: entryId,
      userId,
      eventDate: data.eventDate,
      eventTime: data.eventTime ?? null,
      symptom: data.symptom,
      severity: data.severity ?? null,
      mood: data.mood ?? null,
      energy: data.energy ?? null,
      sleepQuality: data.sleepQuality ?? null,
      dailyImpactEncrypted: cryptoService.encryptField(data.dailyImpact),
      notesEncrypted: cryptoService.encryptField(data.notes),
      medicationsEncrypted: cryptoService.encryptField(data.medications),
      contexts: JSON.stringify(data.contexts || []),
      recordedAt: data.recordedAt || now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: data.clientUpdatedAt || now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'entry_created',
      entityType: 'symptom_entries',
      entityId: entryId,
      timestamp: now,
    });

    return reply.status(201).send({
      entry: {
        id: entryId,
        eventDate: data.eventDate,
        eventTime: data.eventTime ?? null,
        symptom: data.symptom,
        severity: data.severity ?? null,
        mood: data.mood ?? null,
        energy: data.energy ?? null,
        sleepQuality: data.sleepQuality ?? null,
        dailyImpact: data.dailyImpact ?? null,
        notes: data.notes ?? null,
        medications: data.medications ?? null,
        contexts: data.contexts || [],
        recordedAt: data.recordedAt || now,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        clientUpdatedAt: data.clientUpdatedAt || now,
      },
    });
  });

  // PUT /symptom-entries/:id — update entry
  app.put('/symptom-entries/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateEntrySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid update parameters or unknown fields provided.',
      });
    }

    const userId = request.user!.id;
    const { id } = request.params as { id: string };
    const data = parseResult.data;
    const now = new Date().toISOString();

    const existing = await db.query.symptomEntries.findFirst({
      where: and(
        eq(symptomEntries.id, id),
        eq(symptomEntries.userId, userId),
        isNull(symptomEntries.deletedAt)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Entry not found' });
    }

    const updateValues: Record<string, any> = {
      updatedAt: now,
      clientUpdatedAt: data.clientUpdatedAt || now,
    };

    if (data.eventDate !== undefined) updateValues.eventDate = data.eventDate;
    if (data.eventTime !== undefined) updateValues.eventTime = data.eventTime;
    if (data.symptom !== undefined) updateValues.symptom = data.symptom;
    if (data.severity !== undefined) updateValues.severity = data.severity;
    if (data.mood !== undefined) updateValues.mood = data.mood;
    if (data.energy !== undefined) updateValues.energy = data.energy;
    if (data.sleepQuality !== undefined) updateValues.sleepQuality = data.sleepQuality;
    if (data.dailyImpact !== undefined) updateValues.dailyImpactEncrypted = cryptoService.encryptField(data.dailyImpact);
    if (data.notes !== undefined) updateValues.notesEncrypted = cryptoService.encryptField(data.notes);
    if (data.medications !== undefined) updateValues.medicationsEncrypted = cryptoService.encryptField(data.medications);
    if (data.contexts !== undefined) updateValues.contexts = JSON.stringify(data.contexts);

    await db.update(symptomEntries).set(updateValues).where(eq(symptomEntries.id, id));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'entry_updated',
      entityType: 'symptom_entries',
      entityId: id,
      timestamp: now,
    });

    const updated = await db.query.symptomEntries.findFirst({
      where: eq(symptomEntries.id, id),
    });

    return {
      entry: {
        id: updated!.id,
        eventDate: updated!.eventDate,
        eventTime: updated!.eventTime,
        symptom: updated!.symptom,
        severity: updated!.severity,
        mood: updated!.mood,
        energy: updated!.energy,
        sleepQuality: updated!.sleepQuality,
        dailyImpact: cryptoService.decryptField(updated!.dailyImpactEncrypted),
        notes: cryptoService.decryptField(updated!.notesEncrypted),
        medications: cryptoService.decryptField(updated!.medicationsEncrypted),
        contexts: JSON.parse(updated!.contexts || '[]'),
        recordedAt: updated!.recordedAt,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
        deletedAt: updated!.deletedAt,
        clientUpdatedAt: updated!.clientUpdatedAt,
      },
    };
  });

  // DELETE /symptom-entries/:id — soft delete
  app.delete('/symptom-entries/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };
    const now = new Date().toISOString();

    const existing = await db.query.symptomEntries.findFirst({
      where: and(
        eq(symptomEntries.id, id),
        eq(symptomEntries.userId, userId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Entry not found' });
    }

    await db.update(symptomEntries)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(eq(symptomEntries.id, id));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'entry_deleted',
      entityType: 'symptom_entries',
      entityId: id,
      timestamp: now,
    });

    return reply.send({ success: true, id });
  });
}
