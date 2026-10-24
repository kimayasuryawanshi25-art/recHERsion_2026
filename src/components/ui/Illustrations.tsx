export function DoctorConsultationIllustration({ className = 'w-48 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" rx="24" fill="url(#bgGrad)" />
      
      {/* Decorative Circles */}
      <circle cx="270" cy="40" r="45" fill="#EDE7F6" opacity="0.6" />
      <circle cx="50" cy="160" r="35" fill="#D9CBEF" opacity="0.3" />
      
      {/* Clipboard base */}
      <rect x="85" y="32" width="150" height="145" rx="14" fill="#FFFFFF" stroke="#D9CBEF" strokeWidth="2.5" />
      <rect x="125" y="24" width="70" height="16" rx="6" fill="#9B72CF" />
      <circle cx="160" cy="32" r="3" fill="#FFFFFF" />
      
      {/* Medical Cross on top */}
      <rect x="156" y="52" width="8" height="20" rx="2" fill="#5B4B8A" />
      <rect x="150" y="58" width="20" height="8" rx="2" fill="#5B4B8A" />
      
      {/* Report text lines */}
      <rect x="105" y="86" width="110" height="7" rx="3.5" fill="#EDE7F6" />
      <rect x="105" y="102" width="90" height="7" rx="3.5" fill="#EDE7F6" />
      <rect x="105" y="118" width="100" height="7" rx="3.5" fill="#EDE7F6" />
      
      {/* Checkmarks */}
      <circle cx="112" cy="144" r="7" fill="#14B8A6" />
      <path d="M109 144L111 146L115 142" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="126" y="141" width="65" height="6" rx="3" fill="#E5DDEF" />

      {/* Floating Stethoscope Accent */}
      <path d="M60 70C60 100 80 120 100 120" stroke="#9B72CF" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 3" />
      <circle cx="58" cy="65" r="7" fill="#5B4B8A" />
      
      {/* Heart Pulse Tag */}
      <g filter="url(#shadow)">
        <rect x="205" y="110" width="75" height="42" rx="12" fill="#FFFFFF" stroke="#F43F5E" strokeWidth="1.5" />
        <path d="M220 131H228L233 121L238 141L243 127L247 131H265" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      
      {/* Gradients and Filters */}
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAFAFF" />
          <stop offset="1" stopColor="#F3EEFA" />
        </linearGradient>
        <filter id="shadow" x="200" y="106" width="85" height="52" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5B4B8A" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  );
}

export function GentleWellnessIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="88" fill="#F4F0FA" />
      <circle cx="100" cy="100" r="68" fill="#EDE7F6" />
      
      {/* Lotus / Leaves */}
      <path d="M100 50C100 80 80 110 55 115C80 115 100 95 100 50Z" fill="#9B72CF" opacity="0.85" />
      <path d="M100 50C100 80 120 110 145 115C120 115 100 95 100 50Z" fill="#5B4B8A" opacity="0.85" />
      <path d="M100 68C100 95 86 122 68 126C88 126 100 110 100 68Z" fill="#14B8A6" opacity="0.9" />
      <path d="M100 68C100 95 114 122 132 126C112 126 100 110 100 68Z" fill="#2DD4BF" opacity="0.9" />
      <ellipse cx="100" cy="128" rx="22" ry="8" fill="#5B4B8A" />
      
      {/* Floating Sparkles */}
      <circle cx="148" cy="62" r="4" fill="#F43F5E" />
      <circle cx="52" cy="74" r="3" fill="#9B72CF" />
      <circle cx="152" cy="142" r="3" fill="#14B8A6" />
    </svg>
  );
}

export function EmptyRecordsIllustration({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="72" fill="#FAFAFF" stroke="#EDE7F6" strokeWidth="2" />
      {/* Open Journal */}
      <rect x="42" y="45" width="76" height="70" rx="8" fill="#FFFFFF" stroke="#D9CBEF" strokeWidth="2" />
      <line x1="80" y1="45" x2="80" y2="115" stroke="#EDE7F6" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="52" y1="62" x2="70" y2="62" stroke="#D3C7E3" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="74" x2="72" y2="74" stroke="#EDE7F6" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="86" x2="66" y2="86" stroke="#EDE7F6" strokeWidth="2" strokeLinecap="round" />
      <line x1="88" y1="62" x2="106" y2="62" stroke="#D3C7E3" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="88" y1="74" x2="108" y2="74" stroke="#EDE7F6" strokeWidth="2" strokeLinecap="round" />
      {/* Heart bookmark */}
      <path d="M76 43C76 40 78 37 81 37C83 37 84 38.5 84 38.5C84 38.5 85 37 87 37C90 37 92 40 92 43C92 48 84 53 84 53C84 53 76 48 76 43Z" fill="#F43F5E" />
    </svg>
  );
}
