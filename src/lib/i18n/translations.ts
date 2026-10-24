export type LanguageCode = 'en' | 'hi' | 'mr';

export interface TranslationDictionary {
  // Navigation
  'nav.overview': string;
  'nav.aboutMe': string;
  'nav.navigator': string;
  'nav.finder': string;
  'nav.records': string;
  'nav.journal': string;
  'nav.timeline': string;
  'nav.consultation': string;
  'nav.teleconsult': string;
  'nav.preventive': string;
  'nav.learn': string;
  'nav.privacy': string;
  'nav.settings': string;

  // Common UI
  'common.save': string;
  'common.cancel': string;
  'common.edit': string;
  'common.delete': string;
  'common.add': string;
  'common.close': string;
  'common.next': string;
  'common.back': string;
  'common.loading': string;
  'common.copied': string;
  'common.search': string;
  'common.discreet': string;
  'common.quickEscape': string;

  // Disclaimers & Safety
  'disclaimer.defaultSafe': string;
  'disclaimer.notDiagnostic': string;
  'disclaimer.emergencyNotice': string;
  'disclaimer.privacyNotice': string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    'nav.overview': 'Overview',
    'nav.aboutMe': 'About Me',
    'nav.navigator': 'Care Navigator',
    'nav.finder': 'Care Finder',
    'nav.records': 'Records Vault',
    'nav.journal': 'Journal',
    'nav.timeline': 'Timeline & Insights',
    'nav.consultation': 'Appointment Prep',
    'nav.teleconsult': 'Simulated Consult',
    'nav.preventive': 'Preventive Care',
    'nav.learn': 'Learn',
    'nav.privacy': 'Privacy & Data',
    'nav.settings': 'Settings',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.copied': 'Copied!',
    'common.search': 'Search...',
    'common.discreet': 'Discreet Mode',
    'common.quickEscape': 'Quick Escape',

    'disclaimer.defaultSafe': 'If you are worried, speak to a health professional.',
    'disclaimer.notDiagnostic': 'This organizer summarizes self-reported observations. It does not provide clinical assessments or treatment directives.',
    'disclaimer.emergencyNotice': 'In a life-threatening emergency, call 000 (Australia) or your local emergency department immediately.',
    'disclaimer.privacyNotice': 'Your health records stay encrypted and private on your device.',
  },
  hi: {
    'nav.overview': 'अवलोकन',
    'nav.aboutMe': 'मेरे बारे में',
    'nav.navigator': 'देखभाल नेविगेटर',
    'nav.finder': 'देखभाल खोज',
    'nav.records': 'रिकॉर्ड्स वॉल्ट',
    'nav.journal': 'डायरी',
    'nav.timeline': 'टाइमलाइन और अंतर्दृष्टि',
    'nav.consultation': 'अपॉइंटमेंट तैयारी',
    'nav.teleconsult': 'सिम्युलेटेड परामर्श',
    'nav.preventive': 'निवारक देखभाल',
    'nav.learn': 'सीखें',
    'nav.privacy': 'गोपनीयता और डेटा',
    'nav.settings': 'सेटिंग्स',

    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.add': 'जोड़ें',
    'common.close': 'बंद करें',
    'common.next': 'आगे',
    'common.back': 'पीछे',
    'common.loading': 'लोड हो रहा है...',
    'common.copied': 'कॉपी हो गया!',
    'common.search': 'खोजें...',
    'common.discreet': 'गोपनीय मोड',
    'common.quickEscape': 'त्वरित निकास',

    'disclaimer.defaultSafe': 'यदि आप चिंतित हैं, तो स्वास्थ्य पेशेवर से बात करें।',
    'disclaimer.notDiagnostic': 'यह आयोजक स्व-रिपोर्ट किए गए अवलोकनों को सारांशित करता है। यह चिकित्सा निष्कर्ष या निर्देश प्रदान नहीं करता है।',
    'disclaimer.emergencyNotice': 'आपात स्थिति में, तुरंत 000 (ऑस्ट्रेलिया) या अपने स्थानीय आपातकालीन विभाग को कॉल करें।',
    'disclaimer.privacyNotice': 'आपके स्वास्थ्य रिकॉर्ड आपके डिवाइस पर सुरक्षित और निजी रहते हैं।',
  },
  mr: {
    'nav.overview': 'विहंगावलोकन',
    'nav.aboutMe': 'माझ्याबद्दल',
    'nav.navigator': 'आरोग्य मार्गदर्शक',
    'nav.finder': 'आरोग्य केंद्र शोध',
    'nav.records': 'वैद्यकीय नोंदी वॉल्ट',
    'nav.journal': 'दैनंदिनी',
    'nav.timeline': 'टाइमलाइन आणि अंतर्दृष्टी',
    'nav.consultation': 'भेटीची पूर्वतयारी',
    'nav.teleconsult': 'प्रात्यक्षिक सल्ला',
    'nav.preventive': 'प्रतिबंधक काळजी',
    'nav.learn': 'माहिती व शिक्षण',
    'nav.privacy': 'गोपनीयता आणि डेटा',
    'nav.settings': 'सेटिंग्ज',

    'common.save': 'जतन करा',
    'common.cancel': 'रद्द करा',
    'common.edit': 'संपादित करा',
    'common.delete': 'हटवा',
    'common.add': 'जोडा',
    'common.close': 'बंद करा',
    'common.next': 'पुढे',
    'common.back': 'मागे',
    'common.loading': 'लोड होत आहे...',
    'common.copied': 'कॉपी झाले!',
    'common.search': 'शोधा...',
    'common.discreet': 'गोपनीय मोड',
    'common.quickEscape': 'त्वरित बाहेर पडा',

    'disclaimer.defaultSafe': 'तुम्हाला काळजी वाटत असल्यास, आरोग्य तज्ज्ञांशी बोला.',
    'disclaimer.notDiagnostic': 'हे ॲप स्वतः नोंदवलेल्या लक्षणांचा सारांश देते. हे वैद्यकीय निदान किंवा निर्देश देत नाही.',
    'disclaimer.emergencyNotice': 'तातडीच्या आणीबाणीसाठी, त्वरित 000 (ऑस्ट्रेलिया) किंवा स्थानिक आपत्कालीन विभागाशी संपर्क साधा.',
    'disclaimer.privacyNotice': 'तुमच्या आरोग्याच्या नोंदी तुमच्या फोनवर सुरक्षित व गोपनीय राहतात.',
  },
};

export const AVAILABLE_LANGUAGES: { code: LanguageCode; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇦🇺' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];
