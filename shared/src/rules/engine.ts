import type { SymptomEntry } from '../schemas/health.js';
import { getEntryDate } from '../schemas/health.js';
import type { RuleDefinition, ObservationOutput, RuleEvaluationOptions } from './types.js';

function filterEntries(entries: SymptomEntry[], startDate?: string, endDate?: string): SymptomEntry[] {
  // Exclude soft-deleted entries
  return entries.filter(e => {
    if (e.deletedAt) return false;
    const d = getEntryDate(e);
    if (!d) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

function uniqueDays(entries: SymptomEntry[]): number {
  return new Set(entries.map(e => getEntryDate(e))).size;
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

function computeDateRange(entries: SymptomEntry[], start?: string, end?: string): { start: string; end: string; formatted: string } {
  const dates = entries.map(e => getEntryDate(e)).filter(Boolean).sort();
  const s = start || dates[0] || '';
  const e = end || dates[dates.length - 1] || s;
  return {
    start: s,
    end: e,
    formatted: s && e ? `${s} to ${e}` : 'No date range',
  };
}

export const entryCountRule: RuleDefinition = {
  ruleId: 'entry-count',
  version: '1.0.0',
  status: 'live',
  title: 'Check-in Summary',
  requiredInputs: ['eventDate'],
  minEntries: 1,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    if (filtered.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);
    const span = daysBetween(start, end);
    const days = uniqueDays(filtered);

    return {
      id: `obs-entry-count-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Check-in Summary',
      description: `You recorded ${filtered.length} check-in${filtered.length === 1 ? '' : 's'} across ${days} day${days === 1 ? '' : 's'} during this ${span}-day period.`,
      supportingEntryIds: filtered.map(e => e.id),
      coverage: {
        entriesUsed: filtered.length,
        dateRange: formatted,
      },
      limitation: filtered.length < 5
        ? 'Limited check-ins are recorded. Additional check-ins may provide a clearer picture.'
        : 'Counts reflect recorded check-ins only.',
    };
  },
};

export const symptomFrequencyRule: RuleDefinition = {
  ruleId: 'symptom-frequency',
  version: '1.0.0',
  status: 'live',
  title: 'Most Recorded Symptoms',
  requiredInputs: ['symptom', 'eventDate'],
  minEntries: 2,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    if (filtered.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);
    const freq: Record<string, string[]> = {};
    filtered.forEach(e => {
      if (!freq[e.symptom]) freq[e.symptom] = [];
      freq[e.symptom].push(e.id);
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1].length - a[1].length);
    const top = sorted.slice(0, 5);
    const lines = top.map(([s, ids]) => `${s}: ${ids.length} time${ids.length === 1 ? '' : 's'}`).join(', ');

    return {
      id: `obs-symptom-frequency-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Most Recorded Symptoms',
      description: `Your most frequently recorded symptoms were: ${lines}.`,
      supportingEntryIds: top.flatMap(([, ids]) => ids),
      coverage: {
        entriesUsed: filtered.length,
        dateRange: formatted,
      },
      limitation: 'Frequency reflects how often you recorded each symptom in your log, not clinical severity.',
    };
  },
};

export const severitySummaryRule: RuleDefinition = {
  ruleId: 'severity-summary',
  version: '1.0.0',
  status: 'live',
  title: 'Self-Reported Severity',
  requiredInputs: ['severity', 'eventDate'],
  minEntries: 3,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    // Explicit null/undefined handling: only filter entries that have a numeric severity
    const withSev = filtered.filter(e => typeof e.severity === 'number' && e.severity !== null);
    if (withSev.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);
    const vals = withSev.map(e => e.severity as number);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const high = withSev.filter(e => (e.severity as number) >= 4);

    let desc = `You recorded severity in ${withSev.length} of ${filtered.length} entries. Average: ${avg}/5 (range: ${Math.min(...vals)}–${Math.max(...vals)}).`;
    if (high.length > 0) {
      desc += ` ${high.length} entr${high.length === 1 ? 'y' : 'ies'} had severity 4 or 5.`;
    }

    return {
      id: `obs-severity-summary-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Self-Reported Severity',
      description: desc,
      supportingEntryIds: withSev.map(e => e.id),
      coverage: {
        entriesUsed: withSev.length,
        dateRange: formatted,
      },
      limitation: 'Severity values represent your self-reported rating on a 1–5 scale, not clinical measurements.',
    };
  },
};

export const wellbeingImpactRule: RuleDefinition = {
  ruleId: 'wellbeing-impact',
  version: '1.0.0',
  status: 'live',
  title: 'Wellbeing & Daily Impact',
  requiredInputs: ['sleepQuality', 'mood', 'energy', 'dailyImpact'],
  minEntries: 1,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    if (filtered.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);

    const poorSleep = filtered.filter(e => typeof e.sleepQuality === 'number' && e.sleepQuality !== null && e.sleepQuality <= 2);
    const lowMood = filtered.filter(e => typeof e.mood === 'number' && e.mood !== null && e.mood <= 2);
    const lowEnergy = filtered.filter(e => typeof e.energy === 'number' && e.energy !== null && e.energy <= 2);
    const withImpact = filtered.filter(e => e.dailyImpact && e.dailyImpact.trim());

    const parts: string[] = [];
    if (poorSleep.length > 0) parts.push(`poor/very poor sleep in ${poorSleep.length} check-in${poorSleep.length === 1 ? '' : 's'}`);
    if (lowMood.length > 0) parts.push(`low/very low mood in ${lowMood.length} check-in${lowMood.length === 1 ? '' : 's'}`);
    if (lowEnergy.length > 0) parts.push(`low/very low energy in ${lowEnergy.length} check-in${lowEnergy.length === 1 ? '' : 's'}`);
    if (withImpact.length > 0) parts.push(`impact on daily activities in ${withImpact.length} check-in${withImpact.length === 1 ? '' : 's'}`);

    if (parts.length === 0) return null;

    const allIds = [...new Set([...poorSleep, ...lowMood, ...lowEnergy, ...withImpact].map(e => e.id))];

    return {
      id: `obs-wellbeing-impact-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Wellbeing & Daily Impact',
      description: `During this period, you recorded: ${parts.join('; ')}.`,
      supportingEntryIds: allIds,
      coverage: {
        entriesUsed: filtered.length,
        dateRange: formatted,
      },
      limitation: 'This reflects what was recorded in your journal. Dates without check-ins are not included.',
    };
  },
};

export const coOccurrenceRule: RuleDefinition = {
  ruleId: 'co-occurrence',
  version: '1.0.0',
  status: 'live',
  title: 'Symptoms Recorded Together',
  requiredInputs: ['symptom', 'eventDate'],
  minEntries: 3,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    if (filtered.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);

    const byDate: Record<string, string[]> = {};
    filtered.forEach(e => {
      const d = getEntryDate(e);
      if (!byDate[d]) byDate[d] = [];
      if (!byDate[d].includes(e.symptom)) byDate[d].push(e.symptom);
    });

    const coOcc = Object.entries(byDate).filter(([, s]) => s.length > 1);
    if (coOcc.length === 0) return null;

    const pairs: Record<string, { count: number; ids: string[] }> = {};
    coOcc.forEach(([d, syms]) => {
      const dayEntries = filtered.filter(e => getEntryDate(e) === d);
      for (let i = 0; i < syms.length; i++) {
        for (let j = i + 1; j < syms.length; j++) {
          const k = [syms[i], syms[j]].sort().join(' & ');
          if (!pairs[k]) pairs[k] = { count: 0, ids: [] };
          pairs[k].count += 1;
          dayEntries.forEach(de => {
            if (de.symptom === syms[i] || de.symptom === syms[j]) {
              pairs[k].ids.push(de.id);
            }
          });
        }
      }
    });

    const sortedPairs = Object.entries(pairs).sort((a, b) => b[1].count - a[1].count);
    const top = sortedPairs[0];
    if (!top) return null;

    return {
      id: `obs-co-occurrence-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Symptoms Recorded Together',
      description: `${top[0]} were both recorded on ${top[1].count} date${top[1].count === 1 ? '' : 's'}. This describes when you recorded them together and does not imply a medical connection or cause.`,
      supportingEntryIds: [...new Set(top[1].ids)],
      coverage: {
        entriesUsed: filtered.length,
        dateRange: formatted,
      },
      limitation: 'Co-occurrence means recorded on the same date. It does not indicate that one symptom caused the other.',
    };
  },
};

export const missingInfoRule: RuleDefinition = {
  ruleId: 'missing-info',
  version: '1.0.0',
  status: 'live',
  title: 'Information Gaps',
  requiredInputs: ['eventDate'],
  minEntries: 2,
  evaluate(entries, options) {
    const filtered = filterEntries(entries, options?.startDate, options?.endDate);
    if (filtered.length < this.minEntries) return null;

    const { start, end, formatted } = computeDateRange(filtered, options?.startDate, options?.endDate);
    const span = daysBetween(start, end);
    const days = uniqueDays(filtered);

    const noSev = filtered.filter(e => e.severity === null || e.severity === undefined).length;
    const noSleep = filtered.filter(e => e.sleepQuality === null || e.sleepQuality === undefined).length;
    const noMood = filtered.filter(e => e.mood === null || e.mood === undefined).length;

    const missing: string[] = [];
    if (noSev > 0) missing.push(`severity (${noSev}/${filtered.length})`);
    if (noSleep > 0) missing.push(`sleep quality (${noSleep}/${filtered.length})`);
    if (noMood > 0) missing.push(`mood (${noMood}/${filtered.length})`);

    if (missing.length === 0 && days === span) return null;

    return {
      id: `obs-missing-info-${start}-${end}`,
      ruleId: this.ruleId,
      ruleVersion: this.version,
      title: 'Information Gaps',
      description: missing.length > 0
        ? `Some optional fields were not recorded: ${missing.join(', ')}. ${days} of ${span} days have entries.`
        : `${days} of ${span} days have entries.`,
      supportingEntryIds: filtered.map(e => e.id),
      coverage: {
        entriesUsed: filtered.length,
        dateRange: formatted,
      },
      limitation: 'Optional fields are entirely voluntary. You may choose to record only what is relevant to you.',
    };
  },
};

// Draft rule demonstration (must never run in production)
export const draftSampleTrendRule: RuleDefinition = {
  ruleId: 'sample-draft-rule',
  version: '0.1.0-draft',
  status: 'draft',
  title: 'Draft Experimental Analysis',
  requiredInputs: ['eventDate'],
  minEntries: 10,
  evaluate(_entries, options) {
    if (options?.isProduction) {
      throw new Error('Draft rules must not run in production');
    }
    return null;
  },
};

export const RULE_REGISTRY: RuleDefinition[] = [
  entryCountRule,
  symptomFrequencyRule,
  severitySummaryRule,
  wellbeingImpactRule,
  coOccurrenceRule,
  missingInfoRule,
  draftSampleTrendRule,
];

export function evaluateRules(
  entries: SymptomEntry[],
  options?: RuleEvaluationOptions,
  registry: RuleDefinition[] = RULE_REGISTRY
): ObservationOutput[] {
  const observations: ObservationOutput[] = [];
  const envNode = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV : undefined;
  const isProd = options?.isProduction ?? (envNode === 'production');

  for (const rule of registry) {
    // Non-negotiable rule 5: Disabled rules never run; draft rules rejected in production
    if (rule.status === 'disabled') continue;
    if (rule.status === 'draft' && isProd) continue;

    try {
      const result = rule.evaluate(entries, { ...options, isProduction: isProd });
      if (!result) continue;
      if (Array.isArray(result)) {
        observations.push(...result);
      } else {
        observations.push(result);
      }
    } catch {
      // Avoid failing whole evaluation on single rule failure
    }
  }

  return observations;
}
