export const SCHEMA_VERSION = '1.0.0';

export type HealthContextId =
  | 'menstrual-health'
  | 'irregular-cycles'
  | 'pregnancy-postpartum'
  | 'midlife-changes'
  | 'later-life'
  | 'general-wellbeing';

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

export type Severity = 1 | 2 | 3 | 4 | 5;
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

export const MOOD_LABELS: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
export const ENERGY_LABELS: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very high' };
export const SLEEP_LABELS: Record<number, string> = { 1: 'Very poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Very good' };

export const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Cramps', 'Back pain', 'Bloating', 'Nausea',
  'Hot flash', 'Mood changes', 'Sleep disruption', 'Breast tenderness',
  'Joint pain', 'Anxiety', 'Dizziness', 'Night sweats', 'Brain fog',
];

export interface SymptomEntry {
  id: string;
  date: string;
  time?: string;
  symptom: string;
  severity?: Severity;
  mood?: number;
  energy?: number;
  sleepQuality?: number;
  dailyImpact?: string;
  notes?: string;
  medications?: string;
  contexts: HealthContextId[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  selectedContexts: HealthContextId[];
  onboardingComplete: boolean;
  discreetMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationSummary {
  id: string;
  whatChanged: string;
  mainConcerns: string;
  firstNoticed: string;
  dailyImpact: string;
  relevantRecords: string;
  questionsForDoctor: string;
  selectedEntryIds: string[];
  generatedText: string;
  editedText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportData {
  schemaVersion: string;
  exportDate: string;
  appName: string;
  settings?: UserSettings;
  symptomEntries: SymptomEntry[];
  consultationSummaries: ConsultationSummary[];
}
