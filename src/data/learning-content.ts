export interface LearningCard {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  emoji: string;
}

export const LEARNING_CARDS: LearningCard[] = [
  {
    id: 'lc-1',
    title: 'Keeping a Symptom Diary',
    content: 'Tracking your symptoms over time can help you notice patterns and communicate more effectively with your healthcare professional. Record what you experienced, when it happened, how severe it felt, and how it affected your day. Even brief notes are valuable — consistency matters more than detail.',
    source: 'NHS — Keeping a health diary',
    sourceUrl: 'https://www.nhs.uk/conditions/chronic-fatigue-syndrome-cfs-me/self-help/',
    emoji: '📝',
  },
  {
    id: 'lc-2',
    title: 'Describing Changes Over Time',
    content: 'When speaking with a healthcare professional, it helps to describe how your symptoms have changed rather than just listing them. For example: "My headaches started about six weeks ago and have become more frequent" is more informative than "I get headaches." A timeline of your experiences can make these conversations easier.',
    source: 'AHRQ — Questions Are the Answer',
    sourceUrl: 'https://www.ahrq.gov/patients-consumers/patient-involvement/index.html',
    emoji: '📈',
  },
  {
    id: 'lc-3',
    title: 'Preparing for a Medical Appointment',
    content: 'Before your appointment, write down your main concern, how long you\'ve noticed it, what makes it better or worse, and any questions you\'d like to ask. Bring a summary of relevant symptoms and medications. Don\'t hesitate to ask your provider to explain anything you don\'t understand.',
    source: 'WHO — Patient safety',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/patient-safety',
    emoji: '🩺',
  },
  {
    id: 'lc-4',
    title: 'Recording Daily Impact',
    content: 'Healthcare professionals find it helpful to know how symptoms affect your daily life — whether they interrupt your sleep, limit activities, affect work performance, or change your mood. This context helps them understand the significance of your experience beyond a symptom label.',
    source: 'Mayo Clinic — Appointment preparation',
    sourceUrl: 'https://www.mayoclinic.org/healthy-lifestyle/consumer-health/in-depth/medical-appointments/art-20048236',
    emoji: '🌤️',
  },
  {
    id: 'lc-5',
    title: 'Asking Questions & Sharing Concerns',
    content: 'You have the right to ask questions during any medical appointment. Useful questions include: "What could be causing this?", "What are my options?", "What are the benefits and risks?", and "What should I watch for?" If something is unclear, ask for it to be explained differently.',
    source: 'AHRQ — Be More Involved in Your Health Care',
    sourceUrl: 'https://www.ahrq.gov/patients-consumers/patient-involvement/index.html',
    emoji: '💬',
  },
  {
    id: 'lc-6',
    title: 'Understanding This App\'s Limitations',
    content: 'This app helps you organize and review your own health records. It does not diagnose conditions, predict health outcomes, or provide medical advice. The insights shown are descriptive summaries of what you recorded — they are not clinical assessments. Always discuss health concerns with a qualified healthcare professional.',
    source: 'App documentation',
    sourceUrl: '#',
    emoji: '⚠️',
  },
];
