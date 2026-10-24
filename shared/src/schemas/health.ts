import { z } from 'zod';

export const SCHEMA_VERSION = '1.0.0';

export const HealthContextIdSchema = z.enum([
  'menstrual-health',
  'irregular-cycles',
  'pregnancy-postpartum',
  'midlife-changes',
  'later-life',
  'general-wellbeing',
]);
export type HealthContextId = z.infer<typeof HealthContextIdSchema>;

export interface HealthContext {
  id: HealthContextId;
  label: string;
  description: string;
  emoji: string;
}

export const HEALTH_CONTEXTS: HealthContext[] = [
  { id: 'menstrual-health', label: 'Menstrual Health', description: 'Cycle tracking and menstrual symptoms', emoji: '🌸' },
  { id: 'irregular-cycles', label: 'Irregular Cycles & Ongoing Symptoms', description: 'Chronic pain, irregular patterns, or persistent concerns', emoji: '🔄' },
  { id: 'pregnancy-postpartum', label: 'Pregnancy & Postpartum', description: 'Pregnancy journey and postpartum recovery', emoji: '🤱' },
  { id: 'midlife-changes', label: 'Midlife Changes', description: 'Perimenopause, menopause, and changing symptoms', emoji: '🌅' },
  { id: 'later-life', label: 'Later-Life Wellbeing', description: 'Preventive health and wellness', emoji: '🌿' },
  { id: 'general-wellbeing', label: 'General Wellbeing', description: 'Overall wellness and self-care', emoji: '💜' },
];

export const SeveritySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Severity = z.infer<typeof SeveritySchema>;

export const SEVERITY_LABELS: Record<Severity, string> = {
  1: 'Minimal',
  2: 'Mild',
  3: 'Moderate',
  4: 'Severe',
  5: 'Very severe',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
};

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very high',
};

export const SLEEP_LABELS: Record<number, string> = {
  1: 'Very poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Very good',
};

export const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Cramps', 'Back pain', 'Bloating', 'Nausea',
  'Hot flash', 'Mood changes', 'Sleep disruption', 'Breast tenderness',
  'Joint pain', 'Anxiety', 'Dizziness', 'Night sweats', 'Brain fog',
];

export const SymptomEntrySchema = z.object({
  id: z.string(),
  // eventDate and eventTime separate clinical occurrence from recordedAt
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  eventTime: z.string().nullable().optional(),
  // date & time backwards compatibility fallback
  date: z.string().optional(),
  time: z.string().nullable().optional(),
  symptom: z.string().min(1, 'Symptom name is required'),
  // Unanswered / skipped fields are strictly null or undefined
  severity: SeveritySchema.nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  dailyImpact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  medications: z.string().nullable().optional(),
  contexts: z.array(z.string()).default([]),
  recordedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
});
export type SymptomEntry = z.infer<typeof SymptomEntrySchema>;

export const UserSettingsSchema = z.object({
  id: z.string(),
  selectedContexts: z.array(HealthContextIdSchema),
  onboardingComplete: z.boolean(),
  discreetMode: z.boolean(),
  displayName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const ConsultationSummarySchema = z.object({
  id: z.string(),
  whatChanged: z.string().default(''),
  mainConcerns: z.string().default(''),
  firstNoticed: z.string().default(''),
  dailyImpact: z.string().default(''),
  relevantRecords: z.string().default(''),
  questionsForDoctor: z.string().default(''),
  selectedEntryIds: z.array(z.string()).default([]),
  generatedText: z.string().default(''),
  editedText: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type ConsultationSummary = z.infer<typeof ConsultationSummarySchema>;

export const ExportDataSchema = z.object({
  schemaVersion: z.string(),
  exportDate: z.string(),
  appName: z.string(),
  settings: UserSettingsSchema.optional(),
  symptomEntries: z.array(SymptomEntrySchema),
  consultationSummaries: z.array(ConsultationSummarySchema),
  profileSections: z.union([z.record(z.string(), z.any()), z.array(z.any())]).optional(),
  healthItems: z.array(z.any()).optional(),
  lifeEvents: z.array(z.any()).optional(),
  careTeam: z.array(z.any()).optional(),
  medicineEvents: z.array(z.any()).optional(),
});
export type ExportData = z.infer<typeof ExportDataSchema>;

/**
 * Utility to get standard YYYY-MM-DD from an entry safely supporting both
 * eventDate and legacy date.
 */
export function getEntryDate(entry: { eventDate?: string; date?: string }): string {
  return entry.eventDate || entry.date || '';
}

/**
 * Utility to get event time safely.
 */
export function getEntryTime(entry: { eventTime?: string | null; time?: string | null }): string | undefined {
  return entry.eventTime || entry.time || undefined;
}
