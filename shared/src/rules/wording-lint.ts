/**
 * Non-negotiable wording linter:
 * Ensures all copy is strictly descriptive rather than diagnostic, prescriptive, or predictive.
 */

export const FORBIDDEN_PATTERNS: { regex: RegExp; phrase: string; description: string }[] = [
  {
    regex: /\byou have\b/i,
    phrase: 'you have',
    description: 'Avoid diagnostic assertion. Use descriptive framing: "You recorded..."',
  },
  {
    regex: /\byou may have\b/i,
    phrase: 'you may have',
    description: 'Avoid speculative diagnostic suggestion. Describe recorded observations only.',
  },
  {
    regex: /\bthis means\b/i,
    phrase: 'this means',
    description: 'Avoid clinical inference. Present data and let clinicians interpret meaning.',
  },
  {
    regex: /\babnormal\b/i,
    phrase: 'abnormal',
    description: 'Avoid medical judgment verdict. Describe variation or recorded values directly.',
  },
  {
    // "normal" as a clinical verdict (e.g. "is normal", "are normal", "result is normal")
    regex: /\b(?:is|are|looks?|results?|values?|levels?)\s+normal\b/i,
    phrase: 'normal (as verdict)',
    description: 'Avoid declaring a clinical condition "normal". Report numbers and frequencies.',
  },
  {
    regex: /\byou are at risk\b/i,
    phrase: 'you are at risk',
    description: 'Avoid risk prediction. State factual history only.',
  },
  {
    regex: /\byou should take\b/i,
    phrase: 'you should take',
    description: 'Avoid prescribing or medical directives. Use prompts like "Discuss with your doctor".',
  },
];

export interface WordingViolation {
  phrase: string;
  matchedText: string;
  description: string;
  index: number;
}

export function lintWording(text: string): { valid: boolean; violations: WordingViolation[] } {
  const violations: WordingViolation[] = [];

  for (const { regex, phrase, description } of FORBIDDEN_PATTERNS) {
    const match = regex.exec(text);
    if (match) {
      violations.push({
        phrase,
        matchedText: match[0],
        description,
        index: match.index,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
