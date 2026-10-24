import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { medicationEvents, appointments, screeningRecords, auditEvents } from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';

// Schemas
const CreateMedicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().nullable().optional(),
  takenAt: z.string(),
  notes: z.string().nullable().optional(),
}).strict();

const CreateAppointmentSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providerName: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  questions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  followUpPlan: z.string().nullable().optional(),
}).strict();

const CreateScreeningSchema = z.object({
  screeningType: z.string().min(1),
  state: z.enum(['history_needed', 'eligibility_known', 'discuss_or_due', 'scheduled', 'completed']),
  dueDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  clinicianPlan: z.string().nullable().optional(),
}).strict();

export async function clinicalRoutes(app: FastifyInstance): Promise<void> {
  // --- Medications ---
  app.get('/medications', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db.query.medicationEvents.findMany({
      where: and(eq(medicationEvents.userId, userId), isNull(medicationEvents.deletedAt)),
    });

    return {
      medications: rows.map(r => ({
        id: r.id,
        name: cryptoService.decryptField(r.nameEncrypted),
        dose: r.dose,
        takenAt: r.takenAt,
        notes: cryptoService.decryptField(r.notesEncrypted),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  });

  app.post('/medications', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateMedicationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid medication parameters.' });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(medicationEvents).values({
      id,
      userId,
      nameEncrypted: cryptoService.encrypt(data.name),
      dose: data.dose ?? null,
      takenAt: data.takenAt,
      notesEncrypted: cryptoService.encryptField(data.notes),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'medication_created',
      entityType: 'medication_events',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      medication: {
        id,
        name: data.name,
        dose: data.dose ?? null,
        takenAt: data.takenAt,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  // --- Appointments ---
  app.get('/appointments', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db.query.appointments.findMany({
      where: and(eq(appointments.userId, userId), isNull(appointments.deletedAt)),
    });

    return {
      appointments: rows.map(r => ({
        id: r.id,
        eventDate: r.eventDate,
        providerName: r.providerName,
        specialty: r.specialty,
        questions: cryptoService.decryptField(r.questionsEncrypted),
        notes: cryptoService.decryptField(r.notesEncrypted),
        followUpPlan: cryptoService.decryptField(r.followUpPlanEncrypted),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  });

  app.post('/appointments', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateAppointmentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid appointment parameters.' });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(appointments).values({
      id,
      userId,
      eventDate: data.eventDate,
      providerName: data.providerName ?? null,
      specialty: data.specialty ?? null,
      questionsEncrypted: cryptoService.encryptField(data.questions),
      notesEncrypted: cryptoService.encryptField(data.notes),
      followUpPlanEncrypted: cryptoService.encryptField(data.followUpPlanEncrypted || data.followUpPlan),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'appointment_created',
      entityType: 'appointments',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      appointment: {
        id,
        eventDate: data.eventDate,
        providerName: data.providerName ?? null,
        specialty: data.specialty ?? null,
        questions: data.questions ?? null,
        notes: data.notes ?? null,
        followUpPlan: data.followUpPlan ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  // --- Screening Records ---
  app.get('/screening-records', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db.query.screeningRecords.findMany({
      where: and(eq(screeningRecords.userId, userId), isNull(screeningRecords.deletedAt)),
    });

    return {
      records: rows.map(r => ({
        id: r.id,
        screeningType: r.screeningType,
        state: r.state,
        dueDate: r.dueDate,
        completedDate: r.completedDate,
        notes: cryptoService.decryptField(r.notesEncrypted),
        clinicianPlan: cryptoService.decryptField(r.clinicianPlanEncrypted),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  });

  app.post('/screening-records', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateScreeningSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid screening parameters.' });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(screeningRecords).values({
      id,
      userId,
      screeningType: data.screeningType,
      state: data.state,
      dueDate: data.dueDate ?? null,
      completedDate: data.completedDate ?? null,
      notesEncrypted: cryptoService.encryptField(data.notes),
      clinicianPlanEncrypted: cryptoService.encryptField(data.clinicianPlan),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'screening_created',
      entityType: 'screening_records',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      record: {
        id,
        screeningType: data.screeningType,
        state: data.state,
        dueDate: data.dueDate ?? null,
        completedDate: data.completedDate ?? null,
        notes: data.notes ?? null,
        clinicianPlan: data.clinicianPlan ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
  });
}
