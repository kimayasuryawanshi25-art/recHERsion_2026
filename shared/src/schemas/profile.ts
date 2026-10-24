import { z } from 'zod';

export const HealthItemStatusSchema = z.enum(['known', 'unknown', 'declined']);
export type HealthItemStatus = z.infer<typeof HealthItemStatusSchema>;

export const HealthItemKindSchema = z.enum(['condition', 'surgery', 'allergy', 'vaccination']);
export type HealthItemKind = z.infer<typeof HealthItemKindSchema>;

export const HealthItemSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  kind: HealthItemKindSchema,
  label: z.string().min(1, 'Label is required'),
  detail: z.string().nullable().optional(),
  status: HealthItemStatusSchema.default('known'),
  recordedDate: z.string().nullable().optional(),
  stoppedDate: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type HealthItem = z.infer<typeof HealthItemSchema>;

export const MedicineEventStatusSchema = z.enum(['active', 'discontinued', 'unknown', 'declined']);
export type MedicineEventStatus = z.infer<typeof MedicineEventStatusSchema>;

export const MedicineEventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Medicine name is required'),
  dose: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  stopDate: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  prescriber: z.string().nullable().optional(),
  status: MedicineEventStatusSchema.default('active'),
  includeInSummary: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type MedicineEvent = z.infer<typeof MedicineEventSchema>;

export const LifeEventCategorySchema = z.enum([
  'relocation',
  'bereavement',
  'job_change',
  'caregiving',
  'pregnancy_or_birth',
  'relationship',
  'other',
]);
export type LifeEventCategory = z.infer<typeof LifeEventCategorySchema>;

export const LifeEventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  date: z.string(),
  category: LifeEventCategorySchema.default('other'),
  notes: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type LifeEvent = z.infer<typeof LifeEventSchema>;

export const CareTeamRoleSchema = z.enum([
  'gp',
  'specialist',
  'allied_health',
  'pharmacist',
  'nurse',
  'other',
]);
export type CareTeamRole = z.infer<typeof CareTeamRoleSchema>;

export const CareTeamMemberSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  role: CareTeamRoleSchema.default('gp'),
  clinic: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type CareTeamMember = z.infer<typeof CareTeamMemberSchema>;

export const AboutMeBasicsSchema = z.object({
  preferredName: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(), // YYYY-MM-DD or null
  age: z.number().nullable().optional(),
  region: z.string().nullable().optional(), // State / Country
  preferredLanguage: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
}).strict();
export type AboutMeBasics = z.infer<typeof AboutMeBasicsSchema>;

export const AboutMeReproductiveSchema = z.object({
  cycleStatus: z.enum(['regular', 'irregular', 'no_longer_menstruating', 'unsure', 'prefer_not_to_say']).nullable().optional(),
  contraceptionOrHormones: z.string().nullable().optional(),
  pregnancyHistory: z.string().nullable().optional(),
  lifeStageContext: z.string().nullable().optional(), // e.g. "perimenopause", "postmenopause", "reproductive_years"
  notes: z.string().nullable().optional(),
  includeInSummary: z.boolean().default(true),
}).strict();
export type AboutMeReproductive = z.infer<typeof AboutMeReproductiveSchema>;

export const AboutMeSectionPayloadSchema = z.object({
  sectionKey: z.enum([
    'basics',
    'health_background',
    'family_history',
    'medicines_supplements',
    'reproductive_context',
    'lifestyle',
    'care_team',
    'life_events',
    'goals_worries',
    'doctor_notes',
  ]),
  content: z.record(z.string(), z.any()),
  updatedAt: z.string().optional(),
}).strict();
export type AboutMeSectionPayload = z.infer<typeof AboutMeSectionPayloadSchema>;

export const ABOUT_ME_SECTION_KEYS = [
  'basics',
  'health_background',
  'family_history',
  'medicines_supplements',
  'reproductive_context',
  'lifestyle',
  'care_team',
  'life_events',
  'goals_worries',
  'doctor_notes',
] as const;

export type AboutMeSectionKey = (typeof ABOUT_ME_SECTION_KEYS)[number];

export const ABOUT_ME_SECTION_METADATA: Record<
  AboutMeSectionKey,
  { title: string; whyWeAsk: string; prompt: string }
> = {
  basics: {
    title: 'Basics & Identity',
    whyWeAsk: 'Helps ensure your consultation notes and preventive guidelines use your preferred name, language, and age group.',
    prompt: 'How would you like to be addressed, and what basics should your healthcare team know?',
  },
  health_background: {
    title: 'Health Background',
    whyWeAsk: 'Provides critical context for any past surgeries, chronic conditions, or allergies when preparing visit summaries.',
    prompt: 'Are there any diagnosed conditions, surgeries, or allergies you would like to keep on record?',
  },
  family_history: {
    title: 'Family Health History',
    whyWeAsk: 'Family history can inform screening timelines (such as breast or colorectal screening) in preventive guidelines.',
    prompt: 'Is there any notable health history in your immediate family (such as heart conditions or cancers)?',
  },
  medicines_supplements: {
    title: 'Medicines & Supplements',
    whyWeAsk: 'Doctors need an accurate picture of what you currently take to evaluate symptom interactions safely.',
    prompt: 'What prescription medicines, over-the-counter remedies, or supplements do you currently take?',
  },
  reproductive_context: {
    title: 'Reproductive & Hormonal Context',
    whyWeAsk: 'Hormonal phases and life stages (like perimenopause or pregnancy) shape symptom patterns across time.',
    prompt: 'What is your current reproductive context or menstrual pattern, if relevant to your health journey?',
  },
  lifestyle: {
    title: 'Lifestyle in Your Own Words',
    whyWeAsk: 'Your sleep habits, movement, nutrition, and daily stresses help complete the picture of your overall wellbeing.',
    prompt: 'In your own words, how would you describe your daily rhythms, sleep, and physical activities?',
  },
  care_team: {
    title: 'My Care Team',
    whyWeAsk: 'Keeps contact information for your regular GP, specialists, or allied health providers in one organized place.',
    prompt: 'Who are the healthcare providers or clinics you currently visit or consult?',
  },
  life_events: {
    title: 'Key Life Events & Milestones',
    whyWeAsk: 'Major life changes (moving, caregiving, grief, job shifts) frequently coincide with physical health changes.',
    prompt: 'Have you experienced any major transitions or life events recently that impacted your wellbeing?',
  },
  goals_worries: {
    title: 'My Goals & Worries',
    whyWeAsk: 'Helps focus short doctor consultations on what matters most to you rather than getting lost in paperwork.',
    prompt: 'What are your top health priorities, goals, or worries right now?',
  },
  doctor_notes: {
    title: 'What I Want My Doctor to Know',
    whyWeAsk: 'A dedicated space to communicate how you prefer to be spoken to and what makes you feel heard.',
    prompt: 'Is there anything specific you would like your doctor to understand about you as a person?',
  },
};

/**
 * Counts how many of the 10 About Me sections have any recorded data.
 * Does NOT generate streaks, scores, or gamified pressure.
 */
export function countAddedProfileSections(sections: Record<string, any>): number {
  let count = 0;
  for (const key of ABOUT_ME_SECTION_KEYS) {
    const data = sections[key];
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      // Check if values inside are non-empty
      const hasValues = Object.values(data).some(v => v !== null && v !== undefined && v !== '');
      if (hasValues) count++;
    }
  }
  return count;
}
