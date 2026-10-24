import { z } from 'zod';

export const FollowupCategorySchema = z.enum([
  'test',
  'referral',
  'prescription_pickup',
  'lifestyle',
  'followup_visit',
  'other',
]);
export type FollowupCategory = z.infer<typeof FollowupCategorySchema>;

export const FollowupTaskSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  debriefId: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  category: FollowupCategorySchema.default('test'),
  dueDate: z.string().nullable().optional(),
  completed: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type FollowupTask = z.infer<typeof FollowupTaskSchema>;

export const CreateFollowupTaskSchema = z.object({
  debriefId: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  category: FollowupCategorySchema.default('test'),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();
export type CreateFollowupTaskInput = z.infer<typeof CreateFollowupTaskSchema>;

export const AppointmentDebriefSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  appointmentId: z.string().nullable().optional(),
  summaryId: z.string().nullable().optional(),
  doctorName: z.string().nullable().optional(),
  clinic: z.string().nullable().optional(),
  visitDate: z.string(),
  discussedTopics: z.string().nullable().optional(),
  testsOrdered: z.string().nullable().optional(),
  prescriptionsChanged: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  followupDate: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  clientUpdatedAt: z.string().optional(),
}).strict();
export type AppointmentDebrief = z.infer<typeof AppointmentDebriefSchema>;

export const CreateDebriefSchema = z.object({
  appointmentId: z.string().nullable().optional(),
  summaryId: z.string().nullable().optional(),
  doctorName: z.string().nullable().optional(),
  clinic: z.string().nullable().optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  discussedTopics: z.string().nullable().optional(),
  testsOrdered: z.string().nullable().optional(),
  prescriptionsChanged: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  followupDate: z.string().nullable().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    category: FollowupCategorySchema.default('test'),
    dueDate: z.string().nullable().optional(),
  })).optional(),
}).strict();
export type CreateDebriefInput = z.infer<typeof CreateDebriefSchema>;
