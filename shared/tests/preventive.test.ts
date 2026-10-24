import { describe, it, expect } from 'vitest';
import {
  evaluatePreventiveItem,
  type PreventiveGuidelineItem,
} from '../src/index.js';

const mockGuideline: PreventiveGuidelineItem = {
  id: 'au-cervical-screening',
  screeningType: 'cervical',
  title: 'Cervical Screening Test (HPV)',
  sourceName: 'Australian Government Department of Health — National Cervical Screening Program',
  sourceUrl: 'https://www.health.gov.au/topics/cervical-screening',
  guidanceVersion: 'NCSP 2024 Guidelines',
  reviewDate: '2024-07-01',
  jurisdiction: 'Australia',
  status: 'sample, not clinically reviewed',
  eligibilitySummary: 'Aged 25 to 74 with a cervix, recommended every 5 years.',
  minAge: 25,
  maxAge: 74,
  intervalYears: 5,
  todo: 'Clinical review needed for individual risk modifiers.',
};

describe('Preventive Care State Machine & Guardrails (Phase 4)', () => {
  it('transition 1: defaults to history_needed with NO computed date when age/history is missing', () => {
    const res = evaluatePreventiveItem(mockGuideline, {});

    expect(res.state).toBe('history_needed');
    expect(res.computedDueDate).toBeNull();
    expect(res.whatIsMissing).toContain('not recorded');
    expect(res.source.status).toBe('sample, not clinically reviewed');
    expect(res.source.jurisdiction).toBe('Australia');
  });

  it('transition 2: enters eligibility_known when user age is recorded but not in eligible bracket', () => {
    const res = evaluatePreventiveItem(mockGuideline, { userAge: 20 });

    expect(res.state).toBe('eligibility_known');
    expect(res.computedDueDate).toBeNull();
    expect(res.whyThisAppears).toContain('Guideline standard eligibility is age 25 to 74');
  });

  it('transition 3: enters discuss_or_due when age is eligible but no prior test date recorded', () => {
    const res = evaluatePreventiveItem(mockGuideline, { userAge: 35 });

    expect(res.state).toBe('discuss_or_due');
    expect(res.computedDueDate).toBeNull(); // Missing completion date produces no computed date
    expect(res.whatIsMissing).toContain('Date of your last screening or test is not recorded');
  });

  it('transition 4: enters completed when test was completed within guideline interval', () => {
    const currentDate = '2026-10-01';
    // Test completed 2 years ago (2024-10-01), interval is 5 years -> due in 2029
    const res = evaluatePreventiveItem(
      mockGuideline,
      { userAge: 35, lastCompletedDate: '2024-10-01' },
      currentDate
    );

    expect(res.state).toBe('completed');
    expect(res.computedDueDate).toBe('2029-10-01');
    expect(res.whatIsMissing).toBeNull();
  });

  it('transition 5: enters discuss_or_due when elapsed time exceeds guideline interval', () => {
    const currentDate = '2026-10-01';
    // Test completed 6 years ago (2020-05-01), interval is 5 years -> due 2025-05-01
    const res = evaluatePreventiveItem(
      mockGuideline,
      { userAge: 35, lastCompletedDate: '2020-05-01' },
      currentDate
    );

    expect(res.state).toBe('discuss_or_due');
    expect(res.computedDueDate).toBe('2025-05-01');
  });

  it('transition 6: enters scheduled when upcoming appointment date is on record', () => {
    const currentDate = '2026-10-01';
    const res = evaluatePreventiveItem(
      mockGuideline,
      { userAge: 35, scheduledDate: '2026-11-15' },
      currentDate
    );

    expect(res.state).toBe('scheduled');
    expect(res.computedDueDate).toBe('2026-11-15');
  });

  it('displays user-entered clinician plan separately with precedence', () => {
    const clinicianPlan = 'Dr. Smith recommended 3-yearly follow-up due to prior ASCUS result.';
    const res = evaluatePreventiveItem(mockGuideline, {
      userAge: 35,
      clinicianPlan,
    });

    expect(res.clinicianPlan).toBe(clinicianPlan);
  });
});
