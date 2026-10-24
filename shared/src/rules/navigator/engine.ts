import type { CareNavigatorInputs, CareAssessmentResult, SourceGuideline } from '../../schemas/navigator.js';
import { assertDescriptiveWording } from '../wording-lint.js';

const WHO_TRIAGE_GUIDELINE: SourceGuideline = {
  title: 'WHO Emergency Triage Assessment and Treatment (ETAT) & Pregnancy Care Guidelines',
  sourceUrl: 'https://www.who.int/publications/i/item/9789241511216',
  verifiedOn: '2026-10-24',
  jurisdiction: 'Global / WHO',
};

const HEALTHDIRECT_GUIDELINE: SourceGuideline = {
  title: 'Healthdirect Australia Symptom Assessment & Urgent Care Framework',
  sourceUrl: 'https://www.healthdirect.gov.au/symptom-checker',
  verifiedOn: '2026-10-24',
  jurisdiction: 'Australia',
};

export function assessCareLevel(inputs: CareNavigatorInputs): CareAssessmentResult {
  const isPregnancyRisk = inputs.pregnantOrPostpartum === 'yes' || inputs.pregnantOrPostpartum === 'possible';

  // 1. EMERGENCY LEVEL CHECKS (Immediate attention required)
  if (inputs.shortnessOfBreathOrChestPain) {
    const result: CareAssessmentResult = {
      careLevel: 'emergency',
      timeframe: 'Immediate (call emergency services or go to the nearest emergency department right away)',
      whereToSeek: 'Emergency Department / Ambulance (Dial 000 in Australia, 112 in EU/India, 911 in US)',
      whoToSee: 'Emergency medical specialists and paramedics',
      reasoning: [
        'Recorded acute shortness of breath or chest discomfort.',
        'Public health triage protocols classify cardiopulmonary symptoms as immediate priority.',
      ],
      questionsForDoctor: [
        'What emergency evaluations and ECG or imaging tests are recommended?',
        'What red flag changes should prompt immediate escalation if I am waiting?',
      ],
      sourceGuideline: WHO_TRIAGE_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.heavyBleeding && isPregnancyRisk) {
    const result: CareAssessmentResult = {
      careLevel: 'emergency',
      timeframe: 'Immediate emergency assessment',
      whereToSeek: 'Nearest Emergency Department or Maternity Assessment Unit',
      whoToSee: 'Emergency physician or obstetric/gynaecologic emergency team',
      reasoning: [
        'Recorded significant vaginal bleeding with pregnancy or possible pregnancy status.',
        'Clinical triage guidelines recommend urgent specialist assessment for bleeding in pregnancy to assess stability.',
      ],
      questionsForDoctor: [
        'What urgent ultrasound or blood tests (such as quantitative hCG) are indicated today?',
        'What specific activity or physical precautions should I follow right now?',
      ],
      sourceGuideline: WHO_TRIAGE_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.suddenSeverePain && isPregnancyRisk) {
    const result: CareAssessmentResult = {
      careLevel: 'emergency',
      timeframe: 'Immediate emergency assessment',
      whereToSeek: 'Nearest Emergency Department or Early Pregnancy Assessment Service',
      whoToSee: 'Emergency doctors and on-call gynaecologist',
      reasoning: [
        'Recorded sudden or severe abdominal/pelvic pain with pregnancy or possible pregnancy status.',
        'Triage standards treat severe acute pain in reproductive settings as an immediate concern requiring clinical exclusion of urgent causes.',
      ],
      questionsForDoctor: [
        'What urgent clinical imaging is recommended to evaluate the source of severe pain?',
        'What symptoms indicate that surgical consultation is necessary?',
      ],
      sourceGuideline: WHO_TRIAGE_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.heavyBleeding && inputs.dizzinessOrFainting) {
    const result: CareAssessmentResult = {
      careLevel: 'emergency',
      timeframe: 'Immediate emergency evaluation',
      whereToSeek: 'Nearest Emergency Department (Call emergency services if unable to stand or drive)',
      whoToSee: 'Emergency medical team',
      reasoning: [
        'Recorded heavy bleeding combined with dizziness or fainting episodes.',
        'Triage protocols prioritize bleeding with postural symptoms or presyncope due to potential volume loss.',
      ],
      questionsForDoctor: [
        'What are my current vital signs and blood counts showing?',
        'What medical treatments are available to manage the bleeding today?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.feverWithRigorsOrStiffNeck && inputs.suddenSeverePain) {
    const result: CareAssessmentResult = {
      careLevel: 'emergency',
      timeframe: 'Immediate emergency medical care',
      whereToSeek: 'Nearest Emergency Department',
      whoToSee: 'Emergency medical team',
      reasoning: [
        'Recorded significant fever (with shaking chills or neck stiffness) paired with acute severe pain.',
        'Combined acute fever and localized severe pain warrants immediate investigation for acute infection.',
      ],
      questionsForDoctor: [
        'What inflammatory markers or blood cultures are recommended?',
        'Do I require admission or IV medication for this infection?',
      ],
      sourceGuideline: WHO_TRIAGE_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  // 2. URGENT LEVEL CHECKS (Same-day or within 12–24 hours)
  if (inputs.heavyBleeding) {
    const result: CareAssessmentResult = {
      careLevel: 'urgent',
      timeframe: 'Same-day (within 12 to 24 hours)',
      whereToSeek: 'Urgent Care Clinic, Walk-in Centre, or Same-Day GP Appointment',
      whoToSee: 'General practitioner or urgent care clinician',
      reasoning: [
        'Recorded unusually heavy bleeding without immediate presyncope or pregnancy red flags.',
        'Clinical frameworks recommend prompt same-day evaluation when bleeding significantly exceeds normal patterns.',
      ],
      questionsForDoctor: [
        'What medication options can help regulate this bleeding safely?',
        'Should we check iron levels or full blood counts?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.suddenSeverePain) {
    const result: CareAssessmentResult = {
      careLevel: 'urgent',
      timeframe: 'Same-day medical evaluation',
      whereToSeek: 'Urgent Care Centre or urgent GP appointment',
      whoToSee: 'General practitioner or emergency care provider',
      reasoning: [
        'Recorded sudden or high-severity pain.',
        'Unaccustomed or severe pain should be physically evaluated within 24 hours to review pelvic or abdominal structures.',
      ],
      questionsForDoctor: [
        'What physical examination or imaging would be most informative?',
        'What pain relief options are safe given my recorded health history?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.feverWithRigorsOrStiffNeck) {
    const result: CareAssessmentResult = {
      careLevel: 'urgent',
      timeframe: 'Same-day medical review',
      whereToSeek: 'Urgent Care Clinic or GP clinic today',
      whoToSee: 'General practitioner or clinic nurse',
      reasoning: [
        'Recorded elevated fever with rigors or stiffness.',
        'High fevers with chills benefit from prompt physical assessment and temperature/vital monitoring.',
      ],
      questionsForDoctor: [
        'What is the probable location of infection based on physical findings?',
        'What specific tests or swabs should be performed?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  if (inputs.dizzinessOrFainting) {
    const result: CareAssessmentResult = {
      careLevel: 'urgent',
      timeframe: 'Within 24 hours',
      whereToSeek: 'GP clinic or Urgent Care centre',
      whoToSee: 'General practitioner',
      reasoning: [
        'Recorded dizziness or fainting.',
        'Episodes of lightheadedness or syncope warrant blood pressure, hydration, and cardiovascular checks.',
      ],
      questionsForDoctor: [
        'Should we check lying and standing blood pressure or blood counts?',
        'Are there any interactions with my current medicines?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  // 3. ROUTINE LEVEL CHECKS (Scheduled GP visit)
  if (inputs.symptomDurationDays >= 7 || inputs.currentPrimaryConcern.trim().length > 0) {
    const result: CareAssessmentResult = {
      careLevel: 'routine',
      timeframe: 'Routine appointment (schedule within the coming week)',
      whereToSeek: 'Your regular GP practice, community health clinic, or specialist',
      whoToSee: 'General practitioner, women’s health clinic doctor, or nurse practitioner',
      reasoning: [
        inputs.symptomDurationDays >= 7
          ? `Recorded symptoms lasting approximately ${inputs.symptomDurationDays} days without immediate emergency red flags.`
          : 'Recorded ongoing health concerns for professional review.',
        'Ongoing symptoms that persist beyond several days are best explored with your trusted primary care provider.',
      ],
      questionsForDoctor: [
        'What investigation pathway or routine evaluations are appropriate for this duration?',
        'Could keeping a 30-day symptom diary help clarify this pattern?',
        'What lifestyle or management options can support comfort in the meantime?',
      ],
      sourceGuideline: HEALTHDIRECT_GUIDELINE,
      disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
    };
    assertDescriptiveWording(result.reasoning.join(' '));
    return result;
  }

  // 4. SELF-CARE / OBSERVATION LEVEL
  const result: CareAssessmentResult = {
    careLevel: 'self_care',
    timeframe: 'Self-observation at home; seek care if symptoms persist or worsen',
    whereToSeek: 'Home comfort with routine community pharmacy or GP contact if desired',
    whoToSee: 'Community pharmacist or general practitioner if questions arise',
    reasoning: [
      'No immediate emergency red flags or persistent prolonged durations were reported.',
      'Symptom tracking and gentle observation are supported by public guidance for mild, short-lived variations.',
    ],
    questionsForDoctor: [
      'What timeline of changes should trigger a booked visit?',
      'What non-pharmacological comfort measures are recommended for this symptom?',
    ],
    sourceGuideline: HEALTHDIRECT_GUIDELINE,
    disclaimer: 'Sample public triage guidance. This organizer does not evaluate or confirm clinical conditions. If you are worried, speak to a health professional.',
  };
  assertDescriptiveWording(result.reasoning.join(' '));
  return result;
}
