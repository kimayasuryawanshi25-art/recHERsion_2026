import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- Phase 1 Tables ---

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  selectedContexts: text('selected_contexts').notNull().default('[]'),
  discreetMode: integer('discreet_mode').notNull().default(0),
  onboardingComplete: integer('onboarding_complete').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userConsents = sqliteTable('user_consents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  consentType: text('consent_type').notNull(), // 'sync_encrypted' | 'ai_summary' | 'discreet_mode'
  granted: integer('granted').notNull().default(1),
  grantedAt: text('granted_at').notNull(),
});

// Non-negotiable rule 6: Never log health content. Audit log stores action and IDs only.
export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  timestamp: text('timestamp').notNull(),
});

// --- Phase 2 Core Tables ---

export const userModules = sqliteTable('user_modules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: text('module_id').notNull(),
  status: text('status').notNull().default('suggested'), // 'suggested' | 'active' | 'declined'
  rationale: text('rationale'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  clientUpdatedAt: text('client_updated_at'),
});

export const symptomEntries = sqliteTable('symptom_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventDate: text('event_date').notNull(),
  eventTime: text('event_time'),
  symptom: text('symptom').notNull(),
  severity: integer('severity'), // 1-5 or null
  mood: integer('mood'), // 1-5 or null
  energy: integer('energy'), // 1-5 or null
  sleepQuality: integer('sleep_quality'), // 1-5 or null
  dailyImpactEncrypted: text('daily_impact_encrypted'),
  notesEncrypted: text('notes_encrypted'),
  medicationsEncrypted: text('medications_encrypted'),
  contexts: text('contexts').notNull().default('[]'),
  recordedAt: text('recorded_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  clientUpdatedAt: text('client_updated_at'),
});

export const medicationEvents = sqliteTable('medication_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nameEncrypted: text('name_encrypted').notNull(),
  dose: text('dose'),
  takenAt: text('taken_at').notNull(),
  notesEncrypted: text('notes_encrypted'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  clientUpdatedAt: text('client_updated_at'),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventDate: text('event_date').notNull(),
  providerName: text('provider_name'),
  specialty: text('specialty'),
  questionsEncrypted: text('questions_encrypted'),
  notesEncrypted: text('notes_encrypted'),
  followUpPlanEncrypted: text('follow_up_plan_encrypted'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  clientUpdatedAt: text('client_updated_at'),
});

export const screeningRecords = sqliteTable('screening_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  screeningType: text('screening_type').notNull(), // e.g. 'cervical' | 'breast'
  state: text('state').notNull(), // 'history_needed' | 'eligibility_known' | 'discuss_or_due' | 'scheduled' | 'completed'
  dueDate: text('due_date'),
  completedDate: text('completed_date'),
  notesEncrypted: text('notes_encrypted'),
  clinicianPlanEncrypted: text('clinician_plan_encrypted'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  clientUpdatedAt: text('client_updated_at'),
});

export const consultationSummaries = sqliteTable('consultation_summaries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  whatChanged: text('what_changed').notNull().default(''),
  mainConcerns: text('main_concerns').notNull().default(''),
  firstNoticed: text('first_noticed').notNull().default(''),
  dailyImpact: text('daily_impact').notNull().default(''),
  relevantRecords: text('relevant_records').notNull().default(''),
  questionsForDoctor: text('questions_for_doctor').notNull().default(''),
  selectedEntryIds: text('selected_entry_ids').notNull().default('[]'),
  generatedText: text('generated_text').notNull().default(''),
  editedText: text('edited_text').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const shareTokens = sqliteTable('share_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  summaryId: text('summary_id').notNull().references(() => consultationSummaries.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  scope: text('scope').notNull().default('read_summary'),
  expiresAt: text('expires_at').notNull(),
  maxViews: integer('max_views').notNull().default(5),
  viewCount: integer('view_count').notNull().default(0),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull(),
});
