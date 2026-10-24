import { describe, it, expect } from 'vitest';
import {
  evaluateRules,
  severitySummaryRule,
  missingInfoRule,
  lintWording,
  type ObservationOutput,
} from '../src/index.js';
import type { SymptomEntry } from '../src/index.js';

function createMockEntry(overrides: Partial<SymptomEntry> = {}): SymptomEntry {
  const d = overrides.eventDate || overrides.date || '2026-10-01';
  return {
    id: `entry-${Math.random().toString(36).substring(2, 9)}`,
    eventDate: d,
    symptom: 'Headache',
    severity: 3,
    mood: 3,
    energy: 3,
    sleepQuality: 3,
    dailyImpact: 'Needed a quiet break',
    notes: 'In the afternoon',
    medications: null,
    contexts: ['general-wellbeing'],
    recordedAt: '2026-10-01T10:00:00Z',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    ...overrides,
  };
}

describe('Rules Engine — Edge Cases & Guards', () => {
  it('handles empty entries array gracefully', () => {
    const obs = evaluateRules([]);
    expect(obs).toEqual([]);
  });

  it('respects minEntries guard for all rules', () => {
    // 1 entry: entryCount rule evaluates, but symptom-frequency, severity-summary, co-occurrence are suppressed
    const entries = [createMockEntry({ eventDate: '2026-10-01', symptom: 'Headache', severity: 4 })];
    const obs = evaluateRules(entries);

    const ruleIds = obs.map(o => o.ruleId);
    expect(ruleIds).toContain('entry-count');
    expect(ruleIds).not.toContain('symptom-frequency');
    expect(ruleIds).not.toContain('severity-summary');
    expect(ruleIds).not.toContain('co-occurrence');
  });

  it('handles explicit null values without converting them to 0 or breaking', () => {
    const entries: SymptomEntry[] = [
      createMockEntry({ eventDate: '2026-10-01', symptom: 'Fatigue', severity: null, mood: null, sleepQuality: null }),
      createMockEntry({ eventDate: '2026-10-02', symptom: 'Fatigue', severity: null, mood: null, sleepQuality: null }),
      createMockEntry({ eventDate: '2026-10-03', symptom: 'Fatigue', severity: 2, mood: null, sleepQuality: null }),
    ];

    // Only 1 entry has numeric severity, below minEntries: 3 of severitySummaryRule
    const sevObs = severitySummaryRule.evaluate(entries);
    expect(sevObs).toBeNull();

    // Missing info rule should identify severity, mood, and sleep as unrecorded
    const missingObs = missingInfoRule.evaluate(entries) as ObservationOutput | null;
    expect(missingObs).not.toBeNull();
    expect(missingObs?.description).toContain('severity (2/3)');
    expect(missingObs?.description).toContain('mood (3/3)');
    expect(missingObs?.description).toContain('sleep quality (3/3)');
  });

  it('filters out soft-deleted entries', () => {
    const liveEntry1 = createMockEntry({ id: 'live-1', eventDate: '2026-10-01', symptom: 'Cramps', severity: 3 });
    const liveEntry2 = createMockEntry({ id: 'live-2', eventDate: '2026-10-02', symptom: 'Cramps', severity: 3 });
    const deletedEntry = createMockEntry({
      id: 'del-1',
      eventDate: '2026-10-03',
      symptom: 'Cramps',
      severity: 5,
      deletedAt: '2026-10-04T00:00:00Z',
    });

    const entries = [liveEntry1, liveEntry2, deletedEntry];
    const obs = evaluateRules(entries);
    const countObs = obs.find(o => o.ruleId === 'entry-count');

    // Should only count the 2 live entries
    expect(countObs?.coverage.entriesUsed).toBe(2);
    expect(countObs?.supportingEntryIds).toEqual(['live-1', 'live-2']);
    expect(countObs?.supportingEntryIds).not.toContain('del-1');
  });

  it('suppresses draft rules when evaluated in production', () => {
    const entries = [createMockEntry(), createMockEntry({ eventDate: '2026-10-02' })];

    const prodObs = evaluateRules(entries, { isProduction: true });
    expect(prodObs.some(o => o.ruleId === 'sample-draft-rule')).toBe(false);

    const devObs = evaluateRules(entries, { isProduction: false });
    expect(devObs.some(o => o.ruleId === 'sample-draft-rule')).toBe(false);
  });
});

describe('Wording Linter & Prohibited Phrases', () => {
  it('detects prohibited phrases', () => {
    const badSample1 = 'You have moderate fatigue based on records.';
    const lint1 = lintWording(badSample1);
    expect(lint1.valid).toBe(false);
    expect(lint1.violations.some(v => v.phrase === 'you have')).toBe(true);

    const badSample2 = 'This means you may have an infection and you are at risk.';
    const lint2 = lintWording(badSample2);
    expect(lint2.valid).toBe(false);
    expect(lint2.violations.map(v => v.phrase)).toEqual(
      expect.arrayContaining(['this means', 'you may have', 'you are at risk'])
    );

    const badSample3 = 'Your heart rate is normal and you should take paracetamol.';
    const lint3 = lintWording(badSample3);
    expect(lint3.valid).toBe(false);
    expect(lint3.violations.some(v => v.phrase === 'normal (as verdict)')).toBe(true);
    expect(lint3.violations.some(v => v.phrase === 'you should take')).toBe(true);
  });

  it('accepts descriptive, factual language', () => {
    const goodSample = 'You recorded headache in 4 of 6 check-ins. Severity averaged 3.2/5.';
    const lint = lintWording(goodSample);
    expect(lint.valid).toBe(true);
    expect(lint.violations).toHaveLength(0);
  });

  it('verifies that all built-in rule outputs pass the wording lint', () => {
    const testDataset: SymptomEntry[] = [
      createMockEntry({ eventDate: '2026-09-01', symptom: 'Hot flash', severity: 4, sleepQuality: 1, mood: 2 }),
      createMockEntry({ eventDate: '2026-09-01', symptom: 'Night sweats', severity: 4, sleepQuality: 1, mood: 2 }),
      createMockEntry({ eventDate: '2026-09-05', symptom: 'Hot flash', severity: 3, sleepQuality: 2, mood: 3 }),
      createMockEntry({ eventDate: '2026-09-10', symptom: 'Hot flash', severity: 4, sleepQuality: 2, mood: 2 }),
    ];

    const observations = evaluateRules(testDataset);
    expect(observations.length).toBeGreaterThan(0);

    for (const obs of observations) {
      const titleLint = lintWording(obs.title);
      expect(titleLint.valid, `Title violation in ${obs.ruleId}: ${JSON.stringify(titleLint.violations)}`).toBe(true);

      const descLint = lintWording(obs.description);
      expect(descLint.valid, `Description violation in ${obs.ruleId}: ${JSON.stringify(descLint.violations)}`).toBe(true);

      const limLint = lintWording(obs.limitation);
      expect(limLint.valid, `Limitation violation in ${obs.ruleId}: ${JSON.stringify(limLint.violations)}`).toBe(true);
    }
  });
});
