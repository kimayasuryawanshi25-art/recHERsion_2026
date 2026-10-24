/**
 * Deterministic Cycle & Period Comparison Engine
 * Factual, non-inferential comparison of cycle lengths, symptom frequencies, and severities.
 * Strictly avoids diagnostic verdicts (no "normal", "abnormal", "PCOS", "endometriosis").
 */

export interface CycleRecord {
  startDate: string;
  endDate?: string;
  cycleLengthDays?: number;
  periodLengthDays?: number;
  peakSeverity?: number | null;
  topSymptoms?: string[];
  averageSleepQuality?: number | null;
}

export interface CycleComparisonResult {
  hasSufficientData: boolean;
  currentCycle: CycleRecord | null;
  previousCycle: CycleRecord | null;
  lengthDifferenceDays: number | null;
  peakSeverityDifference: number | null;
  sleepDifference: number | null;
  summaryText: string;
  clinicalDisclaimer: string;
}

/**
 * Calculates deterministic differences between two consecutive menstrual cycles.
 */
export function compareCycles(
  cycles: CycleRecord[]
): CycleComparisonResult {
  const disclaimer = 'Descriptive comparison based on your self-reported records. If you are worried about cycle changes, speak to a health professional.';

  if (!cycles || cycles.length < 2) {
    return {
      hasSufficientData: false,
      currentCycle: cycles?.[0] || null,
      previousCycle: null,
      lengthDifferenceDays: null,
      peakSeverityDifference: null,
      sleepDifference: null,
      summaryText: 'At least two recorded cycles are needed to describe changes over time.',
      clinicalDisclaimer: disclaimer,
    };
  }

  // Sort latest first
  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const current = sorted[0];
  const previous = sorted[1];

  let lengthDiff: number | null = null;
  if (current.cycleLengthDays != null && previous.cycleLengthDays != null) {
    lengthDiff = current.cycleLengthDays - previous.cycleLengthDays;
  }

  let severityDiff: number | null = null;
  if (current.peakSeverity != null && previous.peakSeverity != null) {
    severityDiff = current.peakSeverity - previous.peakSeverity;
  }

  let sleepDiff: number | null = null;
  if (current.averageSleepQuality != null && previous.averageSleepQuality != null) {
    sleepDiff = Number((current.averageSleepQuality - previous.averageSleepQuality).toFixed(1));
  }

  // Build factual descriptive narrative
  const statements: string[] = [];
  if (current.cycleLengthDays != null && previous.cycleLengthDays != null) {
    const diffText = lengthDiff === 0
      ? 'unchanged from previous'
      : `${Math.abs(lengthDiff!)} days ${lengthDiff! > 0 ? 'longer' : 'shorter'} than previous`;
    statements.push(
      `Latest cycle length was ${current.cycleLengthDays} days (${diffText} cycle of ${previous.cycleLengthDays} days).`
    );
  }

  if (current.peakSeverity != null && previous.peakSeverity != null) {
    if (severityDiff === 0) {
      statements.push(`Peak severity was unchanged at ${current.peakSeverity}/5.`);
    } else {
      statements.push(
        `Peak reported symptom severity was ${current.peakSeverity}/5 (compared to ${previous.peakSeverity}/5 in the previous cycle).`
      );
    }
  }

  if (current.topSymptoms && current.topSymptoms.length > 0) {
    statements.push(`Top reported symptoms this cycle: ${current.topSymptoms.slice(0, 3).join(', ')}.`);
  }

  return {
    hasSufficientData: true,
    currentCycle: current,
    previousCycle: previous,
    lengthDifferenceDays: lengthDiff,
    peakSeverityDifference: severityDiff,
    sleepDifference: sleepDiff,
    summaryText: statements.join(' '),
    clinicalDisclaimer: disclaimer,
  };
}
