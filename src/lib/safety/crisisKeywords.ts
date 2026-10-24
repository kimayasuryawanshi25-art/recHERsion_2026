/**
 * Safety & Crisis Language Detection (Client-side, non-blocking)
 * Detects distress or crisis indicators in personal notes and provides immediate supportive contacts.
 */

const CRISIS_PATTERNS = [
  /\b(?:suicid|kill myself|end my life|want to die|don't want to live|better off dead)\b/i,
  /\b(?:self[-\s]?harm|cut myself|hurting myself)\b/i,
  /\b(?:domestic violence|he hit me|she hit me|afraid of my partner|forced me)\b/i,
];

export interface CrisisSupportContact {
  name: string;
  phone: string;
  hours: string;
  description: string;
}

export const CRISIS_CONTACTS: CrisisSupportContact[] = [
  {
    name: 'Emergency Services',
    phone: '000',
    hours: '24/7',
    description: 'Immediate life-threatening emergency or acute danger',
  },
  {
    name: 'Lifeline Australia',
    phone: '13 11 14',
    hours: '24/7',
    description: 'Free, confidential crisis support and suicide prevention',
  },
  {
    name: '1800RESPECT',
    phone: '1800 737 732',
    hours: '24/7',
    description: 'National domestic, family and sexual violence counselling',
  },
  {
    name: 'Beyond Blue',
    phone: '1300 22 4636',
    hours: '24/7',
    description: 'Mental health support and advice',
  },
];

export function detectCrisisLanguage(text: string): boolean {
  if (!text || text.length < 3) return false;
  return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}
