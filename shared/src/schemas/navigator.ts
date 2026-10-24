import { z } from 'zod';

export const CareLevelSchema = z.enum(['emergency', 'urgent', 'routine', 'self_care']);
export type CareLevel = z.infer<typeof CareLevelSchema>;

export const CareNavigatorInputsSchema = z.object({
  suddenSeverePain: z.boolean().default(false),
  heavyBleeding: z.boolean().default(false),
  pregnantOrPostpartum: z.enum(['yes', 'no', 'possible', 'unknown']).default('unknown'),
  feverWithRigorsOrStiffNeck: z.boolean().default(false),
  shortnessOfBreathOrChestPain: z.boolean().default(false),
  dizzinessOrFainting: z.boolean().default(false),
  symptomDurationDays: z.number().int().min(0).default(0),
  currentPrimaryConcern: z.string().default(''),
  additionalNotes: z.string().nullable().optional(),
}).strict();
export type CareNavigatorInputs = z.infer<typeof CareNavigatorInputsSchema>;

export const SourceGuidelineSchema = z.object({
  title: z.string(),
  sourceUrl: z.string(),
  verifiedOn: z.string(),
  jurisdiction: z.string(),
}).strict();
export type SourceGuideline = z.infer<typeof SourceGuidelineSchema>;

export const CareAssessmentResultSchema = z.object({
  careLevel: CareLevelSchema,
  timeframe: z.string(),
  whereToSeek: z.string(),
  whoToSee: z.string(),
  reasoning: z.array(z.string()),
  questionsForDoctor: z.array(z.string()),
  sourceGuideline: SourceGuidelineSchema,
  disclaimer: z.string(),
}).strict();
export type CareAssessmentResult = z.infer<typeof CareAssessmentResultSchema>;
