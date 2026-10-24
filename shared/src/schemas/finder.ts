import { z } from 'zod';

export const CareProviderTypeSchema = z.enum([
  'gp',
  'urgent_care',
  'hospital_ed',
  'womens_health_clinic',
  'sexual_health_clinic',
  'maternity_service',
  'allied_health',
  'pharmacy',
]);
export type CareProviderType = z.infer<typeof CareProviderTypeSchema>;

export const CostModelSchema = z.enum(['bulk_billing', 'mixed_billing', 'private', 'free_public']);
export type CostModel = z.infer<typeof CostModelSchema>;

export const CareProviderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: CareProviderTypeSchema,
  address: z.string().min(1),
  suburb: z.string(),
  state: z.string(),
  postcode: z.string(),
  country: z.string().default('Australia'),
  phone: z.string().min(1),
  website: z.string().nullable().optional(),
  costModel: CostModelSchema,
  genderAffirming: z.boolean().default(false),
  accessibility: z.array(z.string()).default([]),
  hours: z.string(),
  sourceUrl: z.string().url('Must be a valid registry source URL'),
  verifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
}).strict();
export type CareProvider = z.infer<typeof CareProviderSchema>;

export const HelplineCategorySchema = z.enum([
  'emergency',
  'crisis_mental_health',
  'domestic_family_violence',
  'perinatal',
  'first_nations',
  'lgbtqia',
  'general_health',
]);
export type HelplineCategory = z.infer<typeof HelplineCategorySchema>;

export const HelplineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: HelplineCategorySchema,
  phone: z.string().min(1),
  hours: z.string(),
  chatUrl: z.string().nullable().optional(),
  website: z.string().url(),
  description: z.string(),
  sourceUrl: z.string().url('Must be a valid registry source URL'),
  verifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
}).strict();
export type Helpline = z.infer<typeof HelplineSchema>;

export const ProviderFilterSchema = z.object({
  type: CareProviderTypeSchema.optional(),
  costModel: CostModelSchema.optional(),
  genderAffirming: z.boolean().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  accessibility: z.string().optional(),
}).strict();
export type ProviderFilter = z.infer<typeof ProviderFilterSchema>;
