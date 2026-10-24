import { z } from 'zod';

export const LifeStageIdSchema = z.enum([
  'menstrual_health',
  'fertility_planning',
  'pregnancy_postpartum',
  'perimenopause',
  'postmenopause',
  'general_wellbeing',
]);
export type LifeStageId = z.infer<typeof LifeStageIdSchema>;

export const TransitionSuggestInputSchema = z.object({
  currentStage: LifeStageIdSchema.optional(),
  targetStage: LifeStageIdSchema.optional(),
});
export type TransitionSuggestInput = z.infer<typeof TransitionSuggestInputSchema>;

export const TransitionApplyInputSchema = z.object({
  fromStage: LifeStageIdSchema.optional(),
  toStage: LifeStageIdSchema,
  modulesToEnable: z.array(z.string()).default([]),
  modulesToDecline: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type TransitionApplyInput = z.infer<typeof TransitionApplyInputSchema>;

export const TransitionPlanSchema = z.object({
  currentStage: LifeStageIdSchema.optional(),
  targetStage: LifeStageIdSchema,
  title: z.string(),
  rationale: z.string(),
  suggestedModulesToEnable: z.array(z.object({
    id: z.string(),
    name: z.string(),
    reason: z.string(),
  })),
  suggestedModulesToRetire: z.array(z.object({
    id: z.string(),
    name: z.string(),
    reason: z.string(),
  })),
  recommendedQuestionsForClinician: z.array(z.string()),
  preventiveScreenings: z.array(z.object({
    type: z.string(),
    recommendation: z.string(),
    source: z.string(),
  })),
});
export type TransitionPlan = z.infer<typeof TransitionPlanSchema>;
