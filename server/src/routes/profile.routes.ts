import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  userProfiles,
  profileSections,
  healthItems,
  lifeEvents,
  careTeam,
  medicationEvents,
  auditEvents,
} from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';
import crypto from 'node:crypto';
import { ABOUT_ME_SECTION_KEYS, type AboutMeSectionKey } from '@rechersion/shared';

const UpdateProfileSchema = z.object({
  displayName: z.string().nullable().optional(),
  selectedContexts: z.array(z.string()).optional(),
  discreetMode: z.boolean().optional(),
  onboardingComplete: z.boolean().optional(),
}).strict();

const SaveSectionSchema = z.object({
  content: z.record(z.string(), z.any()),
}).strict();

const CreateHealthItemSchema = z.object({
  kind: z.enum(['condition', 'surgery', 'allergy', 'vaccination']),
  label: z.string().min(1),
  detail: z.string().nullable().optional(),
  status: z.enum(['known', 'unknown', 'declined']).default('known'),
  recordedDate: z.string().nullable().optional(),
  stoppedDate: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
}).strict();

const CreateLifeEventSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  category: z.enum(['relocation', 'bereavement', 'job_change', 'caregiving', 'pregnancy_or_birth', 'relationship', 'other']).default('other'),
  notes: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
}).strict();

const CreateCareTeamSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['gp', 'specialist', 'allied_health', 'pharmacist', 'nurse', 'other']).default('gp'),
  clinic: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
}).strict();

const CreateMedicineEventSchema = z.object({
  name: z.string().min(1),
  dose: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  stopDate: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  prescriber: z.string().nullable().optional(),
  status: z.enum(['active', 'discontinued', 'unknown', 'declined']).default('active'),
  includeInSummary: z.boolean().default(true),
  notes: z.string().nullable().optional(),
}).strict();

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  // --- Standard Profile ---
  app.get('/profile', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!profile) {
      return reply.status(404).send({ error: 'Not Found', message: 'Profile not found' });
    }

    return {
      profile: {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        selectedContexts: profile.selectedContexts ? JSON.parse(profile.selectedContexts) : [],
        discreetMode: Boolean(profile.discreetMode),
        onboardingComplete: Boolean(profile.onboardingComplete),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    };
  });

  app.put('/profile', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateProfileSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid profile data or unknown fields provided.',
      });
    }

    const userId = request.user!.id;
    const data = parseResult.data;
    const now = new Date().toISOString();

    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Profile not found' });
    }

    const updateValues: Record<string, any> = { updatedAt: now };
    if (data.displayName !== undefined) updateValues.displayName = data.displayName;
    if (data.selectedContexts !== undefined) updateValues.selectedContexts = JSON.stringify(data.selectedContexts);
    if (data.discreetMode !== undefined) updateValues.discreetMode = data.discreetMode ? 1 : 0;
    if (data.onboardingComplete !== undefined) updateValues.onboardingComplete = data.onboardingComplete ? 1 : 0;

    await db.update(userProfiles).set(updateValues).where(eq(userProfiles.userId, userId));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'profile_updated',
      entityType: 'user_profiles',
      entityId: existing.id,
      timestamp: now,
    });

    const updated = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return {
      profile: {
        id: updated!.id,
        userId: updated!.userId,
        displayName: updated!.displayName,
        selectedContexts: updated!.selectedContexts ? JSON.parse(updated!.selectedContexts) : [],
        discreetMode: Boolean(updated!.discreetMode),
        onboardingComplete: Boolean(updated!.onboardingComplete),
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      },
    };
  });

  // --- Phase 11: About Me Living Profile Sections ---
  app.get('/profile/about-me', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(profileSections)
      .where(and(eq(profileSections.userId, userId), isNull(profileSections.deletedAt)));

    const sections: Record<string, any> = {};
    for (const row of rows) {
      try {
        const decryptedJson = cryptoService.decryptField(row.contentEncrypted);
        sections[row.sectionKey] = JSON.parse(decryptedJson || '{}');
      } catch {
        sections[row.sectionKey] = {};
      }
    }

    return { sections };
  });

  app.put('/profile/about-me/:sectionKey', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { sectionKey } = request.params as { sectionKey: string };
    if (!ABOUT_ME_SECTION_KEYS.includes(sectionKey as AboutMeSectionKey)) {
      return reply.status(400).send({ error: 'Bad Request', message: `Invalid sectionKey: ${sectionKey}` });
    }

    const parse = SaveSectionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid section payload' });
    }

    const userId = request.user!.id;
    const now = new Date().toISOString();
    const contentEncrypted = cryptoService.encryptField(JSON.stringify(parse.data.content))!;

    const existing = await db
      .select()
      .from(profileSections)
      .where(and(eq(profileSections.userId, userId), eq(profileSections.sectionKey, sectionKey)))
      .limit(1);

    let sectionId: string;
    if (existing.length > 0) {
      sectionId = existing[0].id;
      await db
        .update(profileSections)
        .set({
          contentEncrypted,
          updatedAt: now,
          deletedAt: null,
          clientUpdatedAt: now,
        })
        .where(eq(profileSections.id, sectionId));
    } else {
      sectionId = crypto.randomUUID();
      await db.insert(profileSections).values({
        id: sectionId,
        userId,
        sectionKey,
        contentEncrypted,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        clientUpdatedAt: now,
      });
    }

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'profile_section_saved',
      entityType: 'profile_sections',
      entityId: sectionKey,
      timestamp: now,
    });

    return { success: true, sectionKey, content: parse.data.content };
  });

  // --- Phase 11: Health Items (Conditions, Surgeries, Allergies, Vaccines) ---
  app.get('/profile/health-items', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(healthItems)
      .where(and(eq(healthItems.userId, userId), isNull(healthItems.deletedAt)));

    const items = rows.map(r => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      detail: r.detailEncrypted ? cryptoService.decryptField(r.detailEncrypted) : null,
      status: r.status,
      recordedDate: r.recordedDate,
      stoppedDate: r.stoppedDate,
      includeInSummary: Boolean(r.includeInSummary),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { healthItems: items };
  });

  app.post('/profile/health-items', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateHealthItemSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parse.error.issues[0]?.message });
    }

    const userId = request.user!.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const data = parse.data;

    await db.insert(healthItems).values({
      id,
      userId,
      kind: data.kind,
      label: data.label,
      detailEncrypted: cryptoService.encryptField(data.detail),
      status: data.status,
      recordedDate: data.recordedDate ?? null,
      stoppedDate: data.stoppedDate ?? null,
      includeInSummary: data.includeInSummary ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'health_item_created',
      entityType: 'health_items',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      healthItem: {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  app.delete('/profile/health-items/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const now = new Date().toISOString();

    await db
      .update(healthItems)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(and(eq(healthItems.id, id), eq(healthItems.userId, userId)));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'health_item_deleted',
      entityType: 'health_items',
      entityId: id,
      timestamp: now,
    });

    return { success: true, id };
  });

  // --- Phase 11: Life Events ---
  app.get('/profile/life-events', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(lifeEvents)
      .where(and(eq(lifeEvents.userId, userId), isNull(lifeEvents.deletedAt)));

    const events = rows.map(r => ({
      id: r.id,
      title: r.title,
      date: r.date,
      category: r.category,
      notes: r.notesEncrypted ? cryptoService.decryptField(r.notesEncrypted) : null,
      includeInSummary: Boolean(r.includeInSummary),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { lifeEvents: events };
  });

  app.post('/profile/life-events', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateLifeEventSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parse.error.issues[0]?.message });
    }

    const userId = request.user!.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const data = parse.data;

    await db.insert(lifeEvents).values({
      id,
      userId,
      title: data.title,
      date: data.date,
      category: data.category,
      notesEncrypted: cryptoService.encryptField(data.notes),
      includeInSummary: data.includeInSummary ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'life_event_created',
      entityType: 'life_events',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      lifeEvent: {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  app.delete('/profile/life-events/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const now = new Date().toISOString();

    await db
      .update(lifeEvents)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(and(eq(lifeEvents.id, id), eq(lifeEvents.userId, userId)));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'life_event_deleted',
      entityType: 'life_events',
      entityId: id,
      timestamp: now,
    });

    return { success: true, id };
  });

  // --- Phase 11: Care Team ---
  app.get('/profile/care-team', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(careTeam)
      .where(and(eq(careTeam.userId, userId), isNull(careTeam.deletedAt)));

    const team = rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      clinic: r.clinic,
      phone: r.phoneEncrypted ? cryptoService.decryptField(r.phoneEncrypted) : null,
      email: r.emailEncrypted ? cryptoService.decryptField(r.emailEncrypted) : null,
      notes: r.notesEncrypted ? cryptoService.decryptField(r.notesEncrypted) : null,
      includeInSummary: Boolean(r.includeInSummary),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { careTeam: team };
  });

  app.post('/profile/care-team', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateCareTeamSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parse.error.issues[0]?.message });
    }

    const userId = request.user!.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const data = parse.data;

    await db.insert(careTeam).values({
      id,
      userId,
      name: data.name,
      role: data.role,
      clinic: data.clinic ?? null,
      phoneEncrypted: cryptoService.encryptField(data.phone),
      emailEncrypted: cryptoService.encryptField(data.email),
      notesEncrypted: cryptoService.encryptField(data.notes),
      includeInSummary: data.includeInSummary ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'care_team_created',
      entityType: 'care_team',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      careTeamMember: {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  app.delete('/profile/care-team/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const now = new Date().toISOString();

    await db
      .update(careTeam)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(and(eq(careTeam.id, id), eq(careTeam.userId, userId)));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'care_team_deleted',
      entityType: 'care_team',
      entityId: id,
      timestamp: now,
    });

    return { success: true, id };
  });

  // --- Phase 11: Medicines & Supplements with Start/Stop Dates ---
  app.get('/profile/medicines', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const rows = await db
      .select()
      .from(medicationEvents)
      .where(and(eq(medicationEvents.userId, userId), isNull(medicationEvents.deletedAt)));

    const meds = rows.map(r => ({
      id: r.id,
      name: cryptoService.decryptField(r.nameEncrypted),
      dose: r.dose,
      frequency: r.frequency,
      startDate: r.startDate,
      stopDate: r.stopDate,
      reason: r.reasonEncrypted ? cryptoService.decryptField(r.reasonEncrypted) : null,
      prescriber: r.prescriber,
      status: r.status,
      includeInSummary: Boolean(r.includeInSummary),
      notes: r.notesEncrypted ? cryptoService.decryptField(r.notesEncrypted) : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { medicines: meds };
  });

  app.post('/profile/medicines', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = CreateMedicineEventSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parse.error.issues[0]?.message });
    }

    const userId = request.user!.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const data = parse.data;

    await db.insert(medicationEvents).values({
      id,
      userId,
      nameEncrypted: cryptoService.encryptField(data.name)!,
      dose: data.dose ?? null,
      frequency: data.frequency ?? null,
      startDate: data.startDate ?? null,
      stopDate: data.stopDate ?? null,
      reasonEncrypted: cryptoService.encryptField(data.reason),
      prescriber: data.prescriber ?? null,
      status: data.status,
      includeInSummary: data.includeInSummary ? 1 : 0,
      takenAt: data.startDate || now,
      notesEncrypted: cryptoService.encryptField(data.notes),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      clientUpdatedAt: now,
    });

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'medicine_event_created',
      entityType: 'medication_events',
      entityId: id,
      timestamp: now,
    });

    return reply.status(201).send({
      medicine: {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  app.delete('/profile/medicines/:id', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const now = new Date().toISOString();

    await db
      .update(medicationEvents)
      .set({ deletedAt: now, updatedAt: now, clientUpdatedAt: now })
      .where(and(eq(medicationEvents.id, id), eq(medicationEvents.userId, userId)));

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'medicine_event_deleted',
      entityType: 'medication_events',
      entityId: id,
      timestamp: now,
    });

    return { success: true, id };
  });
}
