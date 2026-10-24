import type { SymptomEntry } from '../schemas/health.js';

export type RuleStatus = 'draft' | 'live' | 'disabled';

export interface Coverage {
  entriesUsed: number;
  dateRange: string;
}

export interface ObservationOutput {
  id: string;
  ruleId: string;
  ruleVersion: string;
  title: string;
  description: string;
  supportingEntryIds: string[];
  coverage: Coverage;
  limitation: string;
  action?: string;
}

export interface RuleEvaluationOptions {
  startDate?: string;
  endDate?: string;
  isProduction?: boolean;
}

export interface RuleDefinition {
  ruleId: string;
  version: string;
  status: RuleStatus;
  title: string;
  requiredInputs: string[];
  minEntries: number;
  evaluate: (entries: SymptomEntry[], options?: RuleEvaluationOptions) => ObservationOutput[] | ObservationOutput | null;
}
