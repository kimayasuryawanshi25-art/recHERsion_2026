import { evaluateRules } from '@rechersion/shared';
import type { SymptomEntry, ObservationOutput } from '@rechersion/shared';

export type Observation = ObservationOutput & {
  dateRange: string;
  entryCount: number;
  limitations: string;
};

export function generateObservations(entries: SymptomEntry[], start: string, end: string): Observation[] {
  const outputs = evaluateRules(entries, { startDate: start, endDate: end });

  return outputs.map(o => ({
    ...o,
    dateRange: o.coverage.dateRange,
    entryCount: o.coverage.entriesUsed,
    limitations: o.limitation,
  }));
}

export * from '@rechersion/shared';
