import { describe, it, expect } from 'vitest';
import { compareCycles, type CycleRecord } from '../src/rules/cycle/comparison.js';
import { lintWording } from '../src/rules/wording-lint.js';

describe('Cycle Comparison Engine', () => {
  it('handles insufficient cycle history gracefully', () => {
    const res = compareCycles([]);
    expect(res.hasSufficientData).toBe(false);
    expect(res.summaryText).toContain('At least two recorded cycles');

    const resOne = compareCycles([{ startDate: '2026-01-01', cycleLengthDays: 28 }]);
    expect(resOne.hasSufficientData).toBe(false);
  });

  it('calculates deterministic differences between two cycles', () => {
    const cycles: CycleRecord[] = [
      {
        startDate: '2026-02-01',
        cycleLengthDays: 32,
        peakSeverity: 4,
        topSymptoms: ['Cramps', 'Headache'],
        averageSleepQuality: 2.5,
      },
      {
        startDate: '2026-01-01',
        cycleLengthDays: 28,
        peakSeverity: 2,
        topSymptoms: ['Fatigue'],
        averageSleepQuality: 3.5,
      },
    ];

    const res = compareCycles(cycles);
    expect(res.hasSufficientData).toBe(true);
    expect(res.lengthDifferenceDays).toBe(4); // 32 - 28 = +4
    expect(res.peakSeverityDifference).toBe(2); // 4 - 2 = +2
    expect(res.sleepDifference).toBe(-1.0); // 2.5 - 3.5 = -1.0
    expect(res.summaryText).toContain('32 days (4 days longer than previous cycle of 28 days)');
  });

  it('produces copy that passes the non-negotiable wording linter', () => {
    const cycles: CycleRecord[] = [
      {
        startDate: '2026-03-01',
        cycleLengthDays: 30,
        peakSeverity: 3,
        topSymptoms: ['Bloating'],
      },
      {
        startDate: '2026-02-01',
        cycleLengthDays: 30,
        peakSeverity: 3,
        topSymptoms: ['Bloating'],
      },
    ];

    const res = compareCycles(cycles);
    const lintSummary = lintWording(res.summaryText);
    const lintDisclaimer = lintWording(res.clinicalDisclaimer);

    expect(lintSummary.valid).toBe(true);
    expect(lintDisclaimer.valid).toBe(true);
    expect(res.clinicalDisclaimer).toContain('If you are worried');
  });
});
