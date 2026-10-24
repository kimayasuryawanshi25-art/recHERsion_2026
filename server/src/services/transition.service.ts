import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { userModules, auditEvents } from '../db/schema.js';
import type {
  TransitionSuggestInput,
  TransitionPlan,
  TransitionApplyInput,
} from '@rechersion/shared';

const TRANSITION_PLANS: Record<string, TransitionPlan> = {
  'menstrual_health->fertility_planning': {
    currentStage: 'menstrual_health',
    targetStage: 'fertility_planning',
    title: 'Transition to Fertility & Conception Planning',
    rationale: 'Transitioning focus from routine cycle logging to identifying fertile windows, basal body temperature, pre-conception nutrition, and preparing questions for a GP consultation.',
    suggestedModulesToEnable: [
      { id: 'fertility', name: 'Fertility & Conception Tracking', reason: 'Focuses on ovulation patterns and fertile window tracking.' },
      { id: 'nutrition', name: 'Preconception & Wellbeing Support', reason: 'Helps log folate, iodine supplementation, and nutritional habits.' },
    ],
    suggestedModulesToRetire: [],
    recommendedQuestionsForClinician: [
      'Are my routine vaccinations (rubella, varicella) and screening checks up to date?',
      'Which pre-pregnancy supplements (such as folic acid and iodine) are recommended for my circumstances?',
      'Should any of my current regular medications or supplements be reviewed before conception?',
    ],
    preventiveScreenings: [
      { type: 'cervical', recommendation: 'Ensure Cervical Screening Test (CST) is current prior to conception.', source: 'National Cervical Screening Program (Australia)' },
      { type: 'general', recommendation: 'Pre-pregnancy health check including blood pressure and routine blood tests.', source: 'RACGP Red Book (10th Edition)' },
    ],
  },
  'perimenopause->postmenopause': {
    currentStage: 'perimenopause',
    targetStage: 'postmenopause',
    title: 'Transition to Postmenopause & Long-Term Health',
    rationale: 'Marked when 12 continuous months have passed without a period. Focus transitions from cycle variability to cardiovascular health, bone density protection, and long-term vitality.',
    suggestedModulesToEnable: [
      { id: 'bone_density', name: 'Bone & Joint Health', reason: 'Helps track physical activity, calcium intake, and bone density scans.' },
      { id: 'heart_cardio', name: 'Cardiovascular Wellbeing', reason: 'Supports recording blood pressure checks and lipid monitoring milestones.' },
    ],
    suggestedModulesToRetire: [
      { id: 'cycle', name: 'Menstrual Cycle Tracking', reason: 'Cycle logging is no longer needed after 12 months without a period.' },
    ],
    recommendedQuestionsForClinician: [
      'Is it time for a comprehensive Cardiovascular Risk Assessment (Heart Health Check)?',
      'Should we evaluate baseline bone mineral density (DEXA scan) based on my history?',
      'If I experience persistent vasomotor, sleep, or genitourinary symptoms, what evidence-based management options are available?',
    ],
    preventiveScreenings: [
      { type: 'breast', recommendation: 'Free biennial screening mammogram recommended for women aged 50–74.', source: 'BreastScreen Australia' },
      { type: 'bowel', recommendation: 'Free home test kit every 2 years for eligible people aged 45–74.', source: 'National Bowel Cancer Screening Program (Australia)' },
      { type: 'heart', recommendation: 'Annual Heart Health Check with GP for adults aged 45+.', source: 'Heart Foundation / MBS Item 699' },
    ],
  },
  'pregnancy_postpartum->routine_wellbeing': {
    currentStage: 'pregnancy_postpartum',
    targetStage: 'general_wellbeing',
    title: 'Transition from Postpartum Recovery to Routine Wellbeing',
    rationale: 'Moving beyond early fourth-trimester healing to re-establishing personal baseline wellbeing, sleep tracking, and resuming routine preventive care.',
    suggestedModulesToEnable: [
      { id: 'cycle', name: 'Menstrual Cycle Tracking', reason: 'To observe when menstrual patterns re-establish postpartum.' },
      { id: 'mental_health', name: 'Sleep & Mood Wellbeing', reason: 'Supports ongoing mental wellbeing check-ins.' },
    ],
    suggestedModulesToRetire: [
      { id: 'postpartum', name: 'Postpartum Healing Tracker', reason: 'Early healing phases have resolved.' },
    ],
    recommendedQuestionsForClinician: [
      'Has my pelvic floor and abdominal wall recovery progressed as expected?',
      'When should my next routine Cervical Screening Test be scheduled?',
      'What contraception or family planning approach is best suited to my current plans?',
    ],
    preventiveScreenings: [
      { type: 'cervical', recommendation: 'Resume 5-yearly Cervical Screening Test if due.', source: 'National Cervical Screening Program (Australia)' },
    ],
  },
};

export async function suggestLifeStageTransition(
  _userId: string,
  input: TransitionSuggestInput
): Promise<TransitionPlan> {
  const current = input.currentStage || 'perimenopause';
  const target = input.targetStage || (current === 'perimenopause' ? 'postmenopause' : 'general_wellbeing');
  const key = `${current}->${target}`;

  if (TRANSITION_PLANS[key]) {
    return TRANSITION_PLANS[key];
  }

  // Generic fallback transition plan
  return {
    currentStage: current,
    targetStage: target,
    title: `Transition to ${target.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    rationale: 'Reviewing active health modules and preventive screening milestones to align with your current health stage.',
    suggestedModulesToEnable: [
      { id: 'routine_screening', name: 'Preventive Health Checks', reason: 'Keeps track of verified Australian screening milestones.' },
    ],
    suggestedModulesToRetire: [],
    recommendedQuestionsForClinician: [
      'Are my preventive health screenings up to date for my current life stage?',
      'What specific health markers or lifestyle changes should I focus on this year?',
    ],
    preventiveScreenings: [
      { type: 'cervical', recommendation: '5-yearly Cervical Screening Test for people aged 25–74.', source: 'National Cervical Screening Program (Australia)' },
      { type: 'heart', recommendation: 'Regular cardiovascular and blood pressure checks.', source: 'RACGP Red Book (10th Edition)' },
    ],
  };
}

export async function applyLifeStageTransition(
  userId: string,
  input: TransitionApplyInput
): Promise<{ success: boolean; activeModules: string[] }> {
  const now = new Date().toISOString();

  // Enable selected modules
  for (const modId of input.modulesToEnable) {
    const [existing] = await db
      .select()
      .from(userModules)
      .where(and(eq(userModules.userId, userId), eq(userModules.moduleId, modId)));

    if (existing) {
      await db
        .update(userModules)
        .set({ status: 'active', rationale: `Enabled during transition to ${input.toStage}`, updatedAt: now })
        .where(eq(userModules.id, existing.id));
    } else {
      await db.insert(userModules).values({
        id: crypto.randomUUID(),
        userId,
        moduleId: modId,
        status: 'active',
        rationale: `Enabled during transition to ${input.toStage}`,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Decline/retire selected modules
  for (const modId of input.modulesToDecline) {
    const [existing] = await db
      .select()
      .from(userModules)
      .where(and(eq(userModules.userId, userId), eq(userModules.moduleId, modId)));

    if (existing) {
      await db
        .update(userModules)
        .set({ status: 'declined', rationale: `Retired during transition to ${input.toStage}`, updatedAt: now })
        .where(eq(userModules.id, existing.id));
    }
  }

  // Fetch currently active modules
  const activeRows = await db
    .select()
    .from(userModules)
    .where(and(eq(userModules.userId, userId), eq(userModules.status, 'active')));

  // Non-negotiable rule 6: Never log health content in audit log. Action and ID only.
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    userId,
    action: 'life_stage_transition_applied',
    entityType: 'life_stage',
    entityId: input.toStage,
    timestamp: now,
  });

  return {
    success: true,
    activeModules: activeRows.map(r => r.moduleId),
  };
}
