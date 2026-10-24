import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';
import { auGuidelines, evaluatePreventiveItem, type EvaluatedScreeningItem } from '@rechersion/shared';
import { db } from '../db/index.js';
import { screeningRecords, userProfiles } from '../db/schema.js';
import { cryptoService } from '../services/crypto.service.js';

export async function screeningTimelineRoutes(app: FastifyInstance): Promise<void> {
  // GET /screening/timeline — Returns preventive timeline with state machine outputs
  app.get('/screening/timeline', { preHandler: (app as any).authenticate }, async (request: FastifyRequest) => {
    const userId = request.user!.id;

    // 1. Load user profile for age or contexts
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    // 2. Load user's screening records
    const userRecords = await db.query.screeningRecords.findMany({
      where: and(eq(screeningRecords.userId, userId), isNull(screeningRecords.deletedAt)),
    });

    const userRecordsMap = new Map(
      userRecords.map(r => [
        r.screeningType,
        {
          completedDate: r.completedDate,
          dueDate: r.dueDate,
          notes: cryptoService.decryptField(r.notesEncrypted),
          clinicianPlan: cryptoService.decryptField(r.clinicianPlanEncrypted),
          state: r.state,
        },
      ])
    );

    // Default demo age or check if profile has birthYear
    const age = (profile as any)?.age ?? null;

    // Evaluate guidelines
    const timelineItems: EvaluatedScreeningItem[] = auGuidelines.map((item: any) => {
      const userRec = userRecordsMap.get(item.screeningType);

      return evaluatePreventiveItem(item, {
        userAge: age,
        lastCompletedDate: userRec?.completedDate || null,
        scheduledDate: userRec?.dueDate || null,
        clinicianPlan: userRec?.clinicianPlan || null,
      });
    });

    return { timeline: timelineItems };
  });
}
