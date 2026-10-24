import type { SymptomEntry, UserSettings } from '../types/health';

// All data is fictional. Maya is a synthetic demo persona.
export const DEMO_PERSONA = { name: 'Maya', age: 44, note: 'Fictional demo persona — not a real person.' };

function d(iso: string, symptom: string, sev?: number, mood?: number, energy?: number, sleep?: number, impact?: string, notes?: string, meds?: string): SymptomEntry {
  const id = `demo-${iso}-${symptom.toLowerCase().replace(/\s/g, '-')}`;
  return {
    id, date: iso, symptom, severity: sev as any, mood, energy, sleepQuality: sleep,
    dailyImpact: impact, notes, medications: meds,
    contexts: ['midlife-changes', 'general-wellbeing'],
    createdAt: `${iso}T08:00:00Z`, updatedAt: `${iso}T08:00:00Z`,
  };
}

export function getDemoEntries(): SymptomEntry[] {
  return [
    // Week 1 — Aug 4–10
    d('2025-08-04', 'Hot flash', 3, 3, 3, 3, 'Had to pause during a meeting', 'Happened twice today'),
    d('2025-08-05', 'Fatigue', 2, 3, 2, 3, undefined, 'Afternoon slump'),
    d('2025-08-06', 'Sleep disruption', 3, 2, 2, 2, 'Woke up several times, tired at work'),
    d('2025-08-06', 'Hot flash', 2, 2, 2, 2),
    d('2025-08-08', 'Headache', 2, 3, 3, 3, undefined, 'Mild tension headache'),
    // Week 2 — Aug 11–17
    d('2025-08-11', 'Hot flash', 4, 2, 2, 2, 'Interrupted client presentation', 'Very uncomfortable', 'Took ibuprofen'),
    d('2025-08-12', 'Joint pain', 2, 3, 3, 3, 'Stiffness in the morning'),
    d('2025-08-13', 'Fatigue', 3, 2, 2, 3, 'Left work early', 'Persistent exhaustion'),
    d('2025-08-14', 'Sleep disruption', 4, 2, 1, 1, 'Night sweats, couldn\'t fall back asleep'),
    d('2025-08-14', 'Night sweats', 3, 2, 1, 1),
    // Week 3 — Aug 18–24
    d('2025-08-19', 'Mood changes', 3, 2, 3, 3, 'Felt tearful without clear reason'),
    d('2025-08-20', 'Hot flash', 3, 3, 2, 3, 'Two episodes during the day'),
    d('2025-08-22', 'Brain fog', 2, 3, 2, 3, 'Difficulty concentrating on reports'),
    // Week 4 — Aug 25–31
    d('2025-08-25', 'Fatigue', 4, 2, 1, 2, 'Cancelled plans with friends', 'Felt drained all day'),
    d('2025-08-27', 'Hot flash', 3, 3, 3, 2, undefined, 'Mostly in the evening'),
    d('2025-08-28', 'Joint pain', 3, 3, 2, 3, 'Had to take a break from gardening', 'Knees and hands', 'Took ibuprofen'),
    d('2025-08-29', 'Sleep disruption', 3, 2, 2, 2, 'Restless night'),
    // Week 5 — Sep 1–7
    d('2025-09-01', 'Hot flash', 2, 4, 3, 4, undefined, 'Milder today'),
    d('2025-09-03', 'Headache', 3, 3, 3, 3, 'Took a long lunch break', 'Tension at the temples', 'Took paracetamol'),
    d('2025-09-05', 'Fatigue', 2, 3, 3, 3),
    // Week 6 — Sep 8–14
    d('2025-09-08', 'Mood changes', 2, 2, 3, 3, undefined, 'Irritable in the morning'),
    d('2025-09-10', 'Sleep disruption', 2, 3, 3, 2, 'Woke up at 3am'),
    d('2025-09-12', 'Hot flash', 4, 2, 2, 2, 'Three episodes, very disruptive', 'Worst day this month'),
    d('2025-09-12', 'Night sweats', 4, 2, 2, 1, 'Changed sheets twice'),
    // Week 7 — Sep 15–21
    d('2025-09-16', 'Brain fog', 3, 3, 2, 3, 'Missed a deadline', 'Couldn\'t focus after lunch'),
    d('2025-09-18', 'Hot flash', 2, 3, 3, 3),
    d('2025-09-19', 'Anxiety', 3, 2, 2, 2, 'Feeling overwhelmed at work'),
    // Week 8 — Sep 22–28
    d('2025-09-22', 'Fatigue', 3, 2, 2, 2, 'Struggled to get out of bed'),
    d('2025-09-23', 'Hot flash', 3, 3, 3, 3, 'During grocery shopping'),
    d('2025-09-25', 'Joint pain', 2, 3, 3, 3, undefined, 'Morning stiffness'),
    d('2025-09-26', 'Sleep disruption', 3, 2, 2, 2, 'Up from 2am to 4am'),
    d('2025-09-27', 'Mood changes', 2, 3, 3, 4, undefined, 'Feeling better today'),
  ];
}

export function getDemoSettings(): UserSettings {
  const now = new Date().toISOString();
  return {
    id: 'user-settings',
    selectedContexts: ['midlife-changes', 'general-wellbeing'],
    onboardingComplete: true,
    discreetMode: false,
    createdAt: now,
    updatedAt: now,
  };
}
