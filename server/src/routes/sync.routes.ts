import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import {
  symptomEntries,
  medicationEvents,
  appointments,
  screeningRecords,
  auditEvents,
} from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';

const OutboxItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'symptom_entry',
    'medication',
    'appointment',
    'screening',
    'profile_section',
    'health_item',
    'life_event',
    'care_team',
    'medicine_event',
  ]),
  action: z.enum(['upsert', 'delete']),
  recordId: z.string(),
  clientUpdatedAt: z.string(),
  data: z.record(z.any()).optional(),
});

const SyncPushSchema = z.object({
  outbox: z.array(OutboxItemSchema),
});

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/sync/pull?since=<iso_timestamp>
  app.get('/pull', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const query = request.query as { since?: string };
    const since = query.since;
    const now = new Date().toISOString();

    // 1. Fetch symptom entries
    const entriesWhere = since
      ? and(eq(symptomEntries.userId, userId), gt(symptomEntries.updatedAt, since))
      : eq(symptomEntries.userId, userId);
    const entryRows = await db.query.symptomEntries.findMany({ where: entriesWhere });

    const decryptedEntries = entryRows.map(r => ({
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

    // 2. Fetch medication events
    const medsWhere = since
      ? and(eq(medicationEvents.userId, userId), gt(medicationEvents.updatedAt, since))
      : eq(medicationEvents.userId, userId);
    const medRows = await db.query.medicationEvents.findMany({ where: medsWhere });
    const decryptedMeds = medRows.map(r => ({
      id: r.id,
      name: cryptoService.decryptField(r.nameEncrypted),
      dose: r.dose,
      takenAt: r.takenAt,
      notes: cryptoService.decryptField(r.notesEncrypted),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt,
    }));

    // 3. Fetch appointments
    const apptsWhere = since
      ? and(eq(appointments.userId, userId), gt(appointments.updatedAt, since))
      : eq(appointments.userId, userId);
    const apptRows = await db.query.appointments.findMany({ where: apptsWhere });
    const decryptedAppts = apptRows.map(r => ({
      id: r.id,
      eventDate: r.eventDate,
      providerName: r.providerName,
      specialty: r.specialty,
      questions: cryptoService.decryptField(r.questionsEncrypted),
      notes: cryptoService.decryptField(r.notesEncrypted),
      followUpPlan: cryptoService.decryptField(r.followUpPlanEncrypted),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt,
    }));

    // 4. Fetch screenings
    const scWhere = since
      ? and(eq(screeningRecords.userId, userId), gt(screeningRecords.updatedAt, since))
      : eq(screeningRecords.userId, userId);
    const scRows = await db.query.screeningRecords.findMany({ where: scWhere });
    const decryptedScreenings = scRows.map(r => ({
      id: r.id,
      screeningType: r.screeningType,
      state: r.state,
      dueDate: r.dueDate,
      completedDate: r.completedDate,
      notes: cryptoService.decryptField(r.notesEncrypted),
      clinicianPlan: cryptoService.decryptField(r.clinicianPlanEncrypted),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt,
    }));

    return {
      entries: decryptedEntries,
      medications: decryptedMeds,
      appointments: decryptedAppts,
      screenings: decryptedScreenings,
      serverTime: now,
    };
  });

  // POST /api/v1/sync/push - push outbox items with last-write-wins by clientUpdatedAt
  app.post('/push', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = SyncPushSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid sync push payload',
        issues: parseResult.error.issues,
      });
    }

    const userId = request.user!.id;
    const { outbox } = parseResult.data;
    const now = new Date().toISOString();
    let syncedCount = 0;
    let conflictsResolved = 0;

    for (const item of outbox) {
      if (item.type === 'symptom_entry') {
        const [existing] = await db
          .select()
          .from(symptomEntries)
          .where(and(eq(symptomEntries.id, item.recordId), eq(symptomEntries.userId, userId)));

        // Conflict check: Last-write-wins by clientUpdatedAt
        if (existing && existing.clientUpdatedAt && existing.clientUpdatedAt > item.clientUpdatedAt) {
          conflictsResolved++;
          continue; // Server has a strictly newer version
        }

        if (item.action === 'delete') {
          if (existing) {
            await db
              .update(symptomEntries)
              .set({ deletedAt: now, clientUpdatedAt: item.clientUpdatedAt, updatedAt: now })
              .where(eq(symptomEntries.id, existing.id));
            syncedCount++;
          }
        } else if (item.data) {
          const d = item.data;
          const entryValues = {
            id: item.recordId,
            userId,
            eventDate: d.eventDate || d.date || now.slice(0, 10),
            eventTime: d.eventTime ?? null,
            symptom: d.symptom || 'Symptom',
            severity: d.severity ?? null,
            mood: d.mood ?? null,
            energy: d.energy ?? null,
            sleepQuality: d.sleepQuality ?? null,
            dailyImpactEncrypted: cryptoService.encryptField(d.dailyImpact),
            notesEncrypted: cryptoService.encryptField(d.notes),
            medicationsEncrypted: cryptoService.encryptField(d.medications),
            contexts: JSON.stringify(d.contexts || []),
            recordedAt: d.recordedAt || now,
            updatedAt: now,
            clientUpdatedAt: item.clientUpdatedAt,
            deletedAt: null,
          };

          if (existing) {
            await db.update(symptomEntries).set(entryValues).where(eq(symptomEntries.id, existing.id));
          } else {
            await db.insert(symptomEntries).values({ ...entryValues, createdAt: now });
          }
          syncedCount++;
        }
      } else if (item.type === 'medication') {
        const [existing] = await db
          .select()
          .from(medicationEvents)
          .where(and(eq(medicationEvents.id, item.recordId), eq(medicationEvents.userId, userId)));

        if (existing && existing.clientUpdatedAt && existing.clientUpdatedAt > item.clientUpdatedAt) {
          conflictsResolved++;
          continue;
        }

        if (item.action === 'delete') {
          if (existing) {
            await db
              .update(medicationEvents)
              .set({ deletedAt: now, clientUpdatedAt: item.clientUpdatedAt, updatedAt: now })
              .where(eq(medicationEvents.id, existing.id));
            syncedCount++;
          }
        } else if (item.data) {
          const d = item.data;
          const medValues = {
            id: item.recordId,
            userId,
            nameEncrypted: cryptoService.encrypt(d.name || 'Medication'),
            dose: d.dose ?? null,
            takenAt: d.takenAt || now,
            notesEncrypted: cryptoService.encryptField(d.notes),
            updatedAt: now,
            clientUpdatedAt: item.clientUpdatedAt,
            deletedAt: null,
          };

          if (existing) {
            await db.update(medicationEvents).set(medValues).where(eq(medicationEvents.id, existing.id));
          } else {
            await db.insert(medicationEvents).values({ ...medValues, createdAt: now });
          }
          syncedCount++;
        }
      } else if (item.type === 'appointment') {
        const [existing] = await db
          .select()
          .from(appointments)
          .where(and(eq(appointments.id, item.recordId), eq(appointments.userId, userId)));

        if (existing && existing.clientUpdatedAt && existing.clientUpdatedAt > item.clientUpdatedAt) {
          conflictsResolved++;
          continue;
        }

        if (item.action === 'delete') {
          if (existing) {
            await db
              .update(appointments)
              .set({ deletedAt: now, clientUpdatedAt: item.clientUpdatedAt, updatedAt: now })
              .where(eq(appointments.id, existing.id));
            syncedCount++;
          }
        } else if (item.data) {
          const d = item.data;
          const apptValues = {
            id: item.recordId,
            userId,
            eventDate: d.eventDate || now.slice(0, 10),
            providerName: d.providerName ?? null,
            specialty: d.specialty ?? null,
            questionsEncrypted: cryptoService.encryptField(d.questions),
            notesEncrypted: cryptoService.encryptField(d.notes),
            followUpPlanEncrypted: cryptoService.encryptField(d.followUpPlan),
            updatedAt: now,
            clientUpdatedAt: item.clientUpdatedAt,
            deletedAt: null,
          };

          if (existing) {
            await db.update(appointments).set(apptValues).where(eq(appointments.id, existing.id));
          } else {
            await db.insert(appointments).values({ ...apptValues, createdAt: now });
          }
          syncedCount++;
        }
      } else if (item.type === 'screening') {
        const [existing] = await db
          .select()
          .from(screeningRecords)
          .where(and(eq(screeningRecords.id, item.recordId), eq(screeningRecords.userId, userId)));

        if (existing && existing.clientUpdatedAt && existing.clientUpdatedAt > item.clientUpdatedAt) {
          conflictsResolved++;
          continue;
        }

        if (item.action === 'delete') {
          if (existing) {
            await db
              .update(screeningRecords)
              .set({ deletedAt: now, clientUpdatedAt: item.clientUpdatedAt, updatedAt: now })
              .where(eq(screeningRecords.id, existing.id));
            syncedCount++;
          }
        } else if (item.data) {
          const d = item.data;
          const scValues = {
            id: item.recordId,
            userId,
            screeningType: d.screeningType || 'cervical',
            state: d.state || 'history_needed',
            dueDate: d.dueDate ?? null,
            completedDate: d.completedDate ?? null,
            notesEncrypted: cryptoService.encryptField(d.notes),
            clinicianPlanEncrypted: cryptoService.encryptField(d.clinicianPlan),
            updatedAt: now,
            clientUpdatedAt: item.clientUpdatedAt,
            deletedAt: null,
          };

          if (existing) {
            await db.update(screeningRecords).set(scValues).where(eq(screeningRecords.id, existing.id));
          } else {
            await db.insert(screeningRecords).values({ ...scValues, createdAt: now });
          }
          syncedCount++;
        }
      }
    }

    // Non-negotiable rule 6: Never log health content. Log action only.
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'sync_push_completed',
      entityType: 'sync',
      entityId: `${syncedCount}_items`,
      timestamp: now,
    });

    return {
      syncedCount,
      conflictsResolved,
      serverTime: now,
    };
  });
}
