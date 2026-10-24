export interface PreventiveItem {
  id: string;
  title: string;
  description: string;
  source?: string;
  sourceUrl?: string;
  jurisdiction?: string;
  emoji: string;
}

export const PREVENTIVE_ITEMS: PreventiveItem[] = [
  {
    id: 'prev-1',
    title: 'Cervical Screening',
    description: 'In Australia, cervical screening (previously known as a Pap test) is recommended every 5 years for people aged 25–74 with a cervix. Check with your healthcare provider about your eligibility and schedule.',
    source: 'Australian Government — National Cervical Screening Program',
    sourceUrl: 'https://www.health.gov.au/topics/cervical-screening',
    jurisdiction: 'Australia',
    emoji: '🔬',
  },
  {
    id: 'prev-2',
    title: 'Breast Screening',
    description: 'BreastScreen Australia provides free mammograms every 2 years for women aged 50–74, and women aged 40–49 are also eligible. Discuss your personal risk factors and screening schedule with your doctor.',
    source: 'BreastScreen Australia',
    sourceUrl: 'https://www.health.gov.au/initiatives-and-programs/breastscreen-australia',
    jurisdiction: 'Australia',
    emoji: '🎗️',
  },
  {
    id: 'prev-3',
    title: 'Keep Track of Your Appointments',
    description: 'Use this app to record when you last had a check-up, screening, or vaccination. Bringing a record of your recent healthcare visits to your next appointment helps your doctor understand your full picture.',
    emoji: '📅',
  },
  {
    id: 'prev-4',
    title: 'Prepare Questions for Your Provider',
    description: 'Before each appointment, write down any questions or concerns. Ask about recommended screenings for your age and health history, any tests you may be due for, and lifestyle changes that could support your wellbeing.',
    emoji: '❓',
  },
  {
    id: 'prev-5',
    title: 'Record Care You\'ve Received',
    description: 'Keep a simple log of preventive care you\'ve already completed — vaccinations, screenings, and check-ups. This helps you and your healthcare team track what\'s been done and what might be coming up.',
    emoji: '✅',
  },
];
