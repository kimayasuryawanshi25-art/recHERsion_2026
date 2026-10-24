import { v4 as uuidv4 } from 'uuid';
import type { SymptomEntry } from '../../types/health';

export interface Observation {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  supportingEntryIds: string[];
  dateRange: string;
  entryCount: number;
  limitations: string;
}

function inRange(entries: SymptomEntry[], start: string, end: string) {
  return entries.filter(e => e.date >= start && e.date <= end);
}

function uniqueDays(entries: SymptomEntry[]) {
  return new Set(entries.map(e => e.date)).size;
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

export function generateObservations(entries: SymptomEntry[], start: string, end: string): Observation[] {
  const filtered = inRange(entries, start, end);
  const obs: Observation[] = [];
  const range = `${start} to ${end}`;
  const span = daysBetween(start, end);
  const days = uniqueDays(filtered);

  if (filtered.length === 0) return obs;

  // 1. Entry count
  obs.push({
    id: uuidv4(), ruleId: 'entry-count',
    title: 'Check-in Summary',
    description: `You recorded ${filtered.length} check-in${filtered.length === 1 ? '' : 's'} across ${days} day${days === 1 ? '' : 's'} during this ${span}-day period.`,
    supportingEntryIds: filtered.map(e => e.id),
    dateRange: range, entryCount: filtered.length,
    limitations: filtered.length < 5 ? 'Limited check-ins are available. More entries may provide a clearer picture.' : 'Counts reflect recorded entries only.',
  });

  // 2. Symptom frequency
  if (filtered.length >= 2) {
    const freq: Record<string, string[]> = {};
    filtered.forEach(e => { if (!freq[e.symptom]) freq[e.symptom] = []; freq[e.symptom].push(e.id); });
    const sorted = Object.entries(freq).sort((a, b) => b[1].length - a[1].length);
    const top = sorted.slice(0, 5);
    const lines = top.map(([s, ids]) => `${s}: ${ids.length} time${ids.length === 1 ? '' : 's'}`).join(', ');
    obs.push({
      id: uuidv4(), ruleId: 'symptom-frequency',
      title: 'Most Recorded Symptoms',
      description: `Your most frequently recorded symptoms were: ${lines}.`,
      supportingEntryIds: top.flatMap(([, ids]) => ids),
      dateRange: range, entryCount: filtered.length,
      limitations: 'Frequency reflects how often you recorded each symptom, not medical severity.',
    });
  }

  // 3. Severity summary
  const withSev = filtered.filter(e => e.severity);
  if (withSev.length >= 3) {
    const vals = withSev.map(e => e.severity!);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const high = withSev.filter(e => e.severity! >= 4);
    let desc = `You recorded severity in ${withSev.length} of ${filtered.length} entries. Average: ${avg}/5 (range: ${Math.min(...vals)}–${Math.max(...vals)}).`;
    if (high.length > 0) desc += ` ${high.length} entr${high.length === 1 ? 'y' : 'ies'} had severity 4 or 5.`;
    obs.push({
      id: uuidv4(), ruleId: 'severity-summary',
      title: 'Self-Reported Severity',
      description: desc,
      supportingEntryIds: withSev.map(e => e.id),
      dateRange: range, entryCount: withSev.length,
      limitations: 'Severity values are your personal assessment on a 1–5 scale, not clinical measurements.',
    });
  }

  // 4. Sleep/mood/energy impact
  const poorSleep = filtered.filter(e => e.sleepQuality && e.sleepQuality <= 2);
  const lowMood = filtered.filter(e => e.mood && e.mood <= 2);
  const lowEnergy = filtered.filter(e => e.energy && e.energy <= 2);
  const withImpact = filtered.filter(e => e.dailyImpact && e.dailyImpact.trim());
  const parts: string[] = [];
  if (poorSleep.length > 0) parts.push(`poor/very poor sleep in ${poorSleep.length} check-in${poorSleep.length === 1 ? '' : 's'}`);
  if (lowMood.length > 0) parts.push(`low/very low mood in ${lowMood.length} check-in${lowMood.length === 1 ? '' : 's'}`);
  if (lowEnergy.length > 0) parts.push(`low/very low energy in ${lowEnergy.length} check-in${lowEnergy.length === 1 ? '' : 's'}`);
  if (withImpact.length > 0) parts.push(`impact on daily activities in ${withImpact.length} check-in${withImpact.length === 1 ? '' : 's'}`);
  if (parts.length > 0) {
    const allIds = [...new Set([...poorSleep, ...lowMood, ...lowEnergy, ...withImpact].map(e => e.id))];
    obs.push({
      id: uuidv4(), ruleId: 'wellbeing-impact',
      title: 'Wellbeing & Daily Impact',
      description: `During this period, you recorded: ${parts.join('; ')}.`,
      supportingEntryIds: allIds,
      dateRange: range, entryCount: filtered.length,
      limitations: 'This reflects what you recorded. Days without entries are not included.',
    });
  }

  // 5. Co-occurrence
  if (filtered.length >= 3) {
    const byDate: Record<string, string[]> = {};
    filtered.forEach(e => { if (!byDate[e.date]) byDate[e.date] = []; if (!byDate[e.date].includes(e.symptom)) byDate[e.date].push(e.symptom); });
    const coOcc = Object.entries(byDate).filter(([, s]) => s.length > 1);
    if (coOcc.length > 0) {
      const pairs: Record<string, number> = {};
      coOcc.forEach(([, syms]) => {
        for (let i = 0; i < syms.length; i++)
          for (let j = i + 1; j < syms.length; j++) {
            const k = [syms[i], syms[j]].sort().join(' & ');
            pairs[k] = (pairs[k] || 0) + 1;
          }
      });
      const top = Object.entries(pairs).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        obs.push({
          id: uuidv4(), ruleId: 'co-occurrence',
          title: 'Symptoms Recorded Together',
          description: `${top[0]} were both recorded on ${top[1]} date${top[1] === 1 ? '' : 's'}. This describes when you recorded them together and does not establish a cause.`,
          supportingEntryIds: filtered.map(e => e.id),
          dateRange: range, entryCount: filtered.length,
          limitations: 'Co-occurrence means recorded on the same date. It does not indicate one caused the other.',
        });
      }
    }
  }

  // 6. Missing info
  const noSev = filtered.filter(e => !e.severity).length;
  const noSleep = filtered.filter(e => !e.sleepQuality).length;
  const noMood = filtered.filter(e => !e.mood).length;
  const missing: string[] = [];
  if (noSev > 0) missing.push(`severity (${noSev}/${filtered.length})`);
  if (noSleep > 0) missing.push(`sleep quality (${noSleep}/${filtered.length})`);
  if (noMood > 0) missing.push(`mood (${noMood}/${filtered.length})`);
  if (missing.length > 0 && filtered.length >= 2) {
    obs.push({
      id: uuidv4(), ruleId: 'missing-info',
      title: 'Information Gaps',
      description: `Some optional fields were not recorded: ${missing.join(', ')}. ${days} of ${span} days have entries.`,
      supportingEntryIds: filtered.map(e => e.id),
      dateRange: range, entryCount: filtered.length,
      limitations: 'Missing fields are optional. You may choose to record only what is relevant.',
    });
  }

  return obs;
}
