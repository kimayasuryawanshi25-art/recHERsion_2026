import { describe, it, expect } from 'vitest';
import { assessCareLevel } from '../src/rules/navigator/engine.js';
import { lintWording } from '../src/rules/wording-lint.js';

describe('Phase 12 - Care Navigator Deterministic Engine (@rechersion/shared)', () => {
  it('1. Flags chest pain or acute shortness of breath as emergency', () => {
    const res = assessCareLevel({
      suddenSeverePain: false,
      heavyBleeding: false,
      pregnantOrPostpartum: 'no',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: true,
      dizzinessOrFainting: false,
      symptomDurationDays: 1,
      currentPrimaryConcern: 'Tightness in chest',
    });

    expect(res.careLevel).toBe('emergency');
    expect(res.timeframe).toContain('Immediate');
    expect(res.whereToSeek).toContain('Emergency Department');
    expect(res.sourceGuideline.sourceUrl).toBeDefined();
    expect(res.sourceGuideline.verifiedOn).toBe('2026-10-24');
  });

  it('2. Flags acute severe pain in pregnancy as emergency', () => {
    const res = assessCareLevel({
      suddenSeverePain: true,
      heavyBleeding: false,
      pregnantOrPostpartum: 'yes',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: false,
      symptomDurationDays: 0,
      currentPrimaryConcern: 'Sharp lower pelvic pain',
    });

    expect(res.careLevel).toBe('emergency');
    expect(res.whereToSeek).toContain('Emergency');
  });

  it('3. Flags heavy bleeding + dizziness/fainting as emergency', () => {
    const res = assessCareLevel({
      suddenSeverePain: false,
      heavyBleeding: true,
      pregnantOrPostpartum: 'no',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: true,
      symptomDurationDays: 1,
      currentPrimaryConcern: 'Heavy bleeding and lightheadedness',
    });

    expect(res.careLevel).toBe('emergency');
  });

  it('4. Triage heavy bleeding alone as urgent (same-day)', () => {
    const res = assessCareLevel({
      suddenSeverePain: false,
      heavyBleeding: true,
      pregnantOrPostpartum: 'no',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: false,
      symptomDurationDays: 1,
      currentPrimaryConcern: 'Soaking 2 pads per hour',
    });

    expect(res.careLevel).toBe('urgent');
    expect(res.timeframe).toContain('Same-day');
  });

  it('5. Triage 7+ days duration as routine GP consultation', () => {
    const res = assessCareLevel({
      suddenSeverePain: false,
      heavyBleeding: false,
      pregnantOrPostpartum: 'no',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: false,
      symptomDurationDays: 14,
      currentPrimaryConcern: 'Mild ongoing cramping',
    });

    expect(res.careLevel).toBe('routine');
    expect(res.whoToSee).toContain('General practitioner');
  });

  it('6. Triage mild short-duration as self-care with safe observation', () => {
    const res = assessCareLevel({
      suddenSeverePain: false,
      heavyBleeding: false,
      pregnantOrPostpartum: 'no',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: false,
      symptomDurationDays: 0,
      currentPrimaryConcern: '',
    });

    expect(res.careLevel).toBe('self_care');
    expect(res.disclaimer).toContain('If you are worried, speak to a health professional.');
  });

  it('7. Guarantees wording strictly passes lintWording (no diagnosis, no false reassurance)', () => {
    const cases = [
      assessCareLevel({ suddenSeverePain: true, heavyBleeding: true, pregnantOrPostpartum: 'yes', feverWithRigorsOrStiffNeck: false, shortnessOfBreathOrChestPain: false, dizzinessOrFainting: false, symptomDurationDays: 1, currentPrimaryConcern: '' }),
      assessCareLevel({ suddenSeverePain: false, heavyBleeding: false, pregnantOrPostpartum: 'no', feverWithRigorsOrStiffNeck: true, shortnessOfBreathOrChestPain: false, dizzinessOrFainting: false, symptomDurationDays: 2, currentPrimaryConcern: '' }),
      assessCareLevel({ suddenSeverePain: false, heavyBleeding: false, pregnantOrPostpartum: 'no', feverWithRigorsOrStiffNeck: false, shortnessOfBreathOrChestPain: false, dizzinessOrFainting: false, symptomDurationDays: 10, currentPrimaryConcern: 'Tiredness' }),
      assessCareLevel({ suddenSeverePain: false, heavyBleeding: false, pregnantOrPostpartum: 'no', feverWithRigorsOrStiffNeck: false, shortnessOfBreathOrChestPain: false, dizzinessOrFainting: false, symptomDurationDays: 0, currentPrimaryConcern: '' }),
    ];

    for (const c of cases) {
      const fullText = [
        c.timeframe,
        c.whereToSeek,
        c.whoToSee,
        ...c.reasoning,
        ...c.questionsForDoctor,
        c.disclaimer,
      ].join(' ');

      const lintIssues = lintWording(fullText);
      expect(lintIssues.valid).toBe(true);
      expect(lintIssues.violations).toEqual([]);
      expect(fullText.toLowerCase()).not.toContain('nothing to worry about');
      expect(fullText.toLowerCase()).not.toContain('no need to worry');
      expect(fullText.toLowerCase()).not.toContain('you probably have');
    }
  });
});
