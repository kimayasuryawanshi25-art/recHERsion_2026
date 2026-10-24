export type ScreeningState =
  | 'history_needed'
  | 'eligibility_known'
  | 'discuss_or_due'
  | 'scheduled'
  | 'completed';

export interface PreventiveGuidelineItem {
  id: string;
  screeningType: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  guidanceVersion: string;
  reviewDate: string;
  jurisdiction: string;
  status: string;
  eligibilitySummary: string;
  minAge: number;
  maxAge: number | null;
  intervalYears: number;
  todo: string;
}

export interface UserScreeningContext {
  userAge?: number | null;
  lastCompletedDate?: string | null;
  scheduledDate?: string | null;
  clinicianPlan?: string | null;
}

export interface EvaluatedScreeningItem {
  itemId: string;
  screeningType: string;
  title: string;
  state: ScreeningState;
  whyThisAppears: string;
  whatIsMissing: string | null;
  computedDueDate: string | null;
  clinicianPlan: string | null;
  source: {
    sourceName: string;
    sourceUrl: string;
    guidanceVersion: string;
    reviewDate: string;
    jurisdiction: string;
    status: string;
    todo: string;
  };
}

export function evaluatePreventiveItem(
  item: PreventiveGuidelineItem,
  context: UserScreeningContext,
  currentDate: string = new Date().toISOString().slice(0, 10)
): EvaluatedScreeningItem {
  const source = {
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    guidanceVersion: item.guidanceVersion,
    reviewDate: item.reviewDate,
    jurisdiction: item.jurisdiction,
    status: item.status,
    todo: item.todo,
  };

  // If a user has a clinician plan recorded, note it separately (takes precedence)
  const clinicianPlan = context.clinicianPlan && context.clinicianPlan.trim() ? context.clinicianPlan.trim() : null;

  // 1. Check if user age / eligibility history is recorded
  if (context.userAge === undefined || context.userAge === null) {
    return {
      itemId: item.id,
      screeningType: item.screeningType,
      title: item.title,
      state: 'history_needed',
      whyThisAppears: `Standard Australian health guidelines recommend this check for people within recommended age ranges.`,
      whatIsMissing: 'Your age and prior screening dates are not recorded. Please ask your clinician.',
      computedDueDate: null, // Strict rule: never invent dates when inputs are missing
      clinicianPlan,
      source,
    };
  }

  // Check age eligibility
  const isEligibleAge =
    context.userAge >= item.minAge && (item.maxAge === null || context.userAge <= item.maxAge);

  if (!isEligibleAge) {
    return {
      itemId: item.id,
      screeningType: item.screeningType,
      title: item.title,
      state: 'eligibility_known',
      whyThisAppears: `Guideline standard eligibility is age ${item.minAge}${item.maxAge ? ` to ${item.maxAge}` : '+'}. You recorded age ${context.userAge}.`,
      whatIsMissing: null,
      computedDueDate: null,
      clinicianPlan,
      source,
    };
  }

  // 2. Check scheduled status
  if (context.scheduledDate && context.scheduledDate >= currentDate) {
    return {
      itemId: item.id,
      screeningType: item.screeningType,
      title: item.title,
      state: 'scheduled',
      whyThisAppears: `You have an appointment or screening scheduled for ${context.scheduledDate}.`,
      whatIsMissing: null,
      computedDueDate: context.scheduledDate,
      clinicianPlan,
      source,
    };
  }

  // 3. Check prior completion date
  if (!context.lastCompletedDate) {
    return {
      itemId: item.id,
      screeningType: item.screeningType,
      title: item.title,
      state: 'discuss_or_due',
      whyThisAppears: `You meet the age criteria (${item.eligibilitySummary}), and no prior completion date is on record.`,
      whatIsMissing: 'Date of your last screening or test is not recorded.',
      computedDueDate: null,
      clinicianPlan,
      source,
    };
  }

  // 4. Calculate interval from last completed date (timezone-independent)
  const [year, month, day] = context.lastCompletedDate.split('-').map(Number);
  const newYear = year + item.intervalYears;
  const computedDueDate = `${newYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (currentDate >= computedDueDate) {
    return {
      itemId: item.id,
      screeningType: item.screeningType,
      title: item.title,
      state: 'discuss_or_due',
      whyThisAppears: `Based on your recorded test on ${context.lastCompletedDate} and the standard ${item.intervalYears}-year interval, this check is due for discussion.`,
      whatIsMissing: null,
      computedDueDate,
      clinicianPlan,
      source,
    };
  }

  return {
    itemId: item.id,
    screeningType: item.screeningType,
    title: item.title,
    state: 'completed',
    whyThisAppears: `Recorded test on ${context.lastCompletedDate} is within the ${item.intervalYears}-year guideline interval.`,
    whatIsMissing: null,
    computedDueDate,
    clinicianPlan,
    source,
  };
}
