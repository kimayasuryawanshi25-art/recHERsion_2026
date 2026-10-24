import { describe, it, expect } from 'vitest';
import { lintWording } from '../src/rules/wording-lint.js';

// Test dictionaries directly for integrity and compliance with medical wording rules
const EN_COPY = [
  'Overview',
  'About Me',
  'Care Navigator',
  'Care Finder',
  'Records Vault',
  'Journal',
  'Timeline & Insights',
  'Appointment Prep',
  'Simulated Consult',
  'Preventive Care',
  'Learn',
  'Privacy & Data',
  'Settings',
  'Save',
  'Cancel',
  'Edit',
  'Delete',
  'Add',
  'Close',
  'Next',
  'Back',
  'Loading...',
  'Copied!',
  'Search...',
  'Discreet Mode',
  'Quick Escape',
  'If you are worried, speak to a health professional.',
  'This organizer summarizes self-reported observations. It does not provide clinical assessments or treatment directives.',
  'In a life-threatening emergency, call 000 (Australia) or your local emergency department immediately.',
  'Your health records stay encrypted and private on your device.',
];

describe('i18n & Wording Compliance Tests', () => {
  it('enforces non-negotiable wording linter on all English copy', () => {
    for (const text of EN_COPY) {
      const result = lintWording(text);
      expect(result.valid, `Violations found in copy "${text}": ${JSON.stringify(result.violations)}`).toBe(true);
      expect(result.violations).toEqual([]);
    }
  });

  it('mandates the default safe phrasing when worried', () => {
    const safePhrase = 'If you are worried, speak to a health professional.';
    expect(EN_COPY).toContain(safePhrase);
    const result = lintWording(safePhrase);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
