import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userModules, auditEvents } from '../db/schema.js';
import crypto from 'node:crypto';

export interface ModuleCatalogItem {
  id: string;
  title: string;
  description: string;
  lifeStage: string;
}

export const MODULE_CATALOG: ModuleCatalogItem[] = [
  {
    id: 'menstrual-beginnings',
    title: 'Menstrual beginnings',
    description: 'Cycle education, rhythm tracking, and initial symptom recording.',
    lifeStage: 'Adolescence & Early reproductive',
  },
  {
    id: 'menstrual-health',
    title: 'Menstrual health',
    description: 'Tracking cycle regularity, flow patterns, and menstrual wellness.',
    lifeStage: 'Reproductive years',
  },
  {
    id: 'pregnancy-support',
    title: 'Pregnancy support',
    description: 'Recording changes, appointments, and prenatal health experiences.',
    lifeStage: 'Pregnancy',
  },
  {
    id: 'recovery-support',
    title: 'Recovery and support',
    description: 'Postpartum recovery observations, sleep patterns, and emotional wellbeing.',
    lifeStage: 'Postpartum',
  },
  {
    id: 'changing-symptoms',
    title: 'Changing symptoms',
    description: 'Recording midlife transitions, perimenopause, hot flashes, and sleep variability.',
    lifeStage: 'Perimenopause & Menopause',
  },
  {
    id: 'ongoing-wellbeing',
    title: 'Ongoing wellbeing',
    description: 'Holistic vitality, bone health, joint mobility, and preventive care tracking.',
    lifeStage: 'Later-life wellbeing',
  },
  {
    id: 'preventive-health',
    title: 'Preventive health',
    description: 'Guidelines-backed screening reminders and regular health check records.',
    lifeStage: 'All life stages',
  },
];

const SuggestModuleSchema = z.object({
  contexts: z.array(z.string()).default([]),
  recentSymptoms: z.array(z.string()).default([]),
}).strict();

const UpdateModuleStatusSchema = z.object({
  status: z.enum(['suggested', 'active', 'declined']),
}).strict();

export async function moduleRoutes(app: FastifyInstance): Promise<void> {
  // GET /modules — Returns full catalog merged with user status
  app.get('/modules', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;
    const userModRows = await db.query.userModules.findMany({
      where: and(eq(userModules.userId, userId), eq(userModules.deletedAt, null as any)),
    });

    const userStatusMap = new Map<string, { status: string; rationale: string | null }>();
    userModRows.forEach(row => {
      userStatusMap.set(row.moduleId, { status: row.status, rationale: row.rationale });
    });

    const catalog = MODULE_CATALOG.map(item => {
      const userState = userStatusMap.get(item.id);
      return {
        ...item,
        status: userState ? userState.status : 'suggested',
        rationale: userState?.rationale || null,
      };
    });

    return { modules: catalog };
  });

  // POST /modules/suggest — Generates suggestions with plain-language reasons; NEVER enables automatically
  app.post('/modules/suggest', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = SuggestModuleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid input parameters for module suggestions.',
      });
    }

    const { contexts, recentSymptoms } = parseResult.data;
    const suggestions: { moduleId: string; title: string; rationale: string }[] = [];

    const symptomsLower = recentSymptoms.map(s => s.toLowerCase());

    if (
      contexts.includes('midlife-changes') ||
      symptomsLower.some(s => s.includes('hot flash') || s.includes('night sweat'))
    ) {
      suggestions.push({
        moduleId: 'changing-symptoms',
        title: 'Changing symptoms',
        rationale: 'Because you recorded midlife context or temperature/sleep changes, this module offers focused symptom tracking.',
      });
    }

    if (
      contexts.includes('menstrual-health') ||
      symptomsLower.some(s => s.includes('cramp') || s.includes('bloating'))
    ) {
      suggestions.push({
        moduleId: 'menstrual-health',
        title: 'Menstrual health',
        rationale: 'Because your entries note menstrual cycle experiences, tracking cycle phases may help organize your timeline.',
      });
    }

    if (contexts.includes('pregnancy-postpartum')) {
      suggestions.push({
        moduleId: 'recovery-support',
        title: 'Recovery and support',
        rationale: 'Because postpartum context was selected, tracking recovery milestones may be helpful for upcoming appointments.',
      });
    }

    // Default recommendation if empty
    if (suggestions.length === 0) {
      suggestions.push({
        moduleId: 'preventive-health',
        title: 'Preventive health',
        rationale: 'Evidence-backed preventive health items provide general check-in reminders across all life stages.',
      });
    }

    return { suggestions };
  });

  // PUT /modules/:moduleId — Explicit user confirmation or decline
  app.put('/modules/:moduleId', { preHandler: (app as any).authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateModuleStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid module status. Must be suggested, active, or declined.',
      });
    }

    const userId = request.user!.id;
    const { moduleId } = request.params as { moduleId: string };
    const { status } = parseResult.data;
    const now = new Date().toISOString();

    const existing = await db.query.userModules.findFirst({
      where: and(eq(userModules.userId, userId), eq(userModules.moduleId, moduleId)),
    });

    if (existing) {
      await db.update(userModules)
        .set({ status, updatedAt: now })
        .where(eq(userModules.id, existing.id));
    } else {
      await db.insert(userModules).values({
        id: crypto.randomUUID(),
        userId,
        moduleId,
        status,
        rationale: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: `module_${status}`,
      entityType: 'user_modules',
      entityId: moduleId,
      timestamp: now,
    });

    return reply.send({ success: true, moduleId, status });
  });
}
