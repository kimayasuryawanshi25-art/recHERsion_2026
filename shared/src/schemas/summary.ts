import { z } from 'zod';

export const SummarySectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});
export type SummarySection = z.infer<typeof SummarySectionSchema>;

export const SummaryInterviewInputSchema = z.object({
  whatChanged: z.string().default(''),
  mainConcerns: z.string().default(''),
  firstNoticed: z.string().default(''),
  dailyImpact: z.string().default(''),
  relevantRecords: z.string().default(''),
  questionsForDoctor: z.string().default(''),
  selectedEntryIds: z.array(z.string()).optional(),
  includeScreenings: z.boolean().default(true),
  includeAppointments: z.boolean().default(true),
  sectionsConfig: z.array(z.object({
    id: z.string(),
    title: z.string(),
    enabled: z.boolean(),
    order: z.number(),
  })).optional(),
});
export type SummaryInterviewInput = z.infer<typeof SummaryInterviewInputSchema>;

export const UpdateSummaryInputSchema = z.object({
  editedText: z.string().optional(),
  sections: z.array(SummarySectionSchema).optional(),
  whatChanged: z.string().optional(),
  mainConcerns: z.string().optional(),
  firstNoticed: z.string().optional(),
  dailyImpact: z.string().optional(),
  relevantRecords: z.string().optional(),
  questionsForDoctor: z.string().optional(),
});
export type UpdateSummaryInput = z.infer<typeof UpdateSummaryInputSchema>;
