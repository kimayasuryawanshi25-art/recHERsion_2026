# HerHealth Companion

**Life-Stage Women's Health Companion** — A privacy-first personal health information organizer built for [recHERsion'26](https://rechersion.com).

> **Core promise:** "Turn scattered health records into a clear story you can take to your doctor — without the app diagnosing you or sharing your information without your permission."

---

## Problem Statement

Women's health information is often scattered across phone notes, symptom trackers, appointment records, calendars, and memory. It can be difficult to recognize changes over time or explain them clearly during a short medical appointment.

**HerHealth Companion** helps users:
- Record health experiences in their own words
- Organize information into a chronological timeline
- Visualize recorded patterns with interactive charts
- Generate explainable, evidence-linked insights
- Prepare an editable appointment summary
- Control their data with full export and deletion capabilities

**This is a health information organization tool. It is not a diagnostic, treatment, triage, or medical-risk-prediction system.**

---

## MVP Features

### 1. Welcome & Health Context Selection
Multi-step onboarding explaining what the app does (and doesn't do), privacy/storage model, and user-selected health contexts (menstrual health, midlife changes, pregnancy, etc.). Contexts are organizational labels — not diagnoses.

### 2. Symptom & Wellbeing Journal (Full CRUD)
Add, view, edit, and delete check-ins with: date, symptom, severity (1–5), mood, sleep quality, energy level, daily impact, notes, and medications. Quick entry for common cases; expandable sections for detailed recording.

### 3. Timeline & Interactive Visualizations
Chronological timeline with date-range and symptom filters. Four data-driven charts built with Recharts:
- **Symptom frequency** bar chart
- **Self-reported severity** trend line
- **Sleep, mood & energy** trends (separate lines, not combined)
- **Daily impact** summary

All charts use actual stored entries — never hardcoded values. Missing data shown as gaps, not zeros.

### 4. Explainable Insights (Deterministic Rules Engine)
Six rule types generate insights from actual records:
- Entry count summary
- Symptom frequency summary
- Self-reported severity summary
- Wellbeing & daily impact summary
- Co-occurrence summary
- Missing information summary

Every insight shows date range, entry count, supporting records, and limitations. Uses careful language: "You recorded…", "Your entries show…". No diagnoses, predictions, or medical claims.

### 5. Appointment Preparation & Summary
Guided 6-question interview → editable text summary combining user answers with recorded data. Supports copy-to-clipboard and browser print/save-as-PDF. Clearly labelled as user-provided information, not medical assessment.

### 6. Privacy & Data Controls
- All data stored locally in browser IndexedDB — no account, no server
- JSON export and validated JSON import (merge or replace modes)
- Delete all data with confirmation
- Discreet mode (neutral app name visible on screen)
- No advertising, analytics, or automatic data sharing
- Honest disclosure of browser storage limitations

### 7. Preventive Care Section
Small set of verified preventive care items with source citations (Australian jurisdiction examples) plus general appointment preparation prompts.

### 8. Learning Library
Six educational cards covering symptom tracking, appointment preparation, describing changes, and app limitations — with source citations.

### 9. Demo Data
One-click load of fictional persona "Maya, age 44" with ~31 check-ins across 8 weeks covering hot flashes, fatigue, sleep disruption, joint pain, mood changes, and more. All clearly marked as synthetic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Storage | IndexedDB via `idb` |
| Icons | Lucide React |
| IDs | `uuid` v4 |
| Routing | React Router DOM v7 |

No backend. No external APIs. No AI services. Works entirely in the browser after initial load.

---

## Setup & Run

### Prerequisites
- Node.js 18+ (tested with Node 25)
- npm

### Install & Run
```bash
cd recHERsion_2026
npm install
npm run dev
```

Open **http://localhost:5173/** in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## Architecture & Data Flow

```
src/
├── App.tsx                    # Root app with routing
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + theme
├── types/
│   └── health.ts              # All TypeScript types & constants
├── lib/
│   ├── db/index.ts            # IndexedDB operations (idb wrapper)
│   └── observations/index.ts  # Deterministic insight rules engine
├── data/
│   ├── demo-data.ts           # Fictional Maya persona data
│   ├── learning-content.ts    # Educational cards
│   └── preventive-items.ts    # Preventive care items
├── components/
│   ├── layout/AppShell.tsx    # Sidebar + mobile nav + main content
│   └── ui/                    # PageHeader, ConfirmDialog
└── features/
    ├── onboarding/            # Welcome, privacy, context selection
    ├── overview/              # Dashboard with stats & quick actions
    ├── journal/               # Journal list + entry form (new/edit)
    ├── timeline/              # Timeline, charts, insights (tabbed)
    ├── consultation/          # 6-question interview → editable summary
    ├── preventive/            # Preventive care items
    ├── learning/              # Educational cards
    └── privacy/               # Export, import, delete, discreet mode
```

**Data flow:** All health records are stored in browser IndexedDB. Components read/write via `src/lib/db/`. The observations engine (`src/lib/observations/`) runs deterministic rules against raw entries — no AI, no external calls. Charts read from the same IndexedDB entries. Nothing leaves the browser.

---

## Privacy & Data Storage

| Aspect | Implementation |
|--------|---------------|
| Storage location | Browser IndexedDB (local only) |
| Account required | No |
| Data sent externally | No |
| Encryption | IndexedDB is **not** encrypted — anyone with access to this browser profile can potentially access the data |
| Deletion scope | Deletes all app-managed records; does not affect previously exported files or screenshots |
| Analytics/tracking | None |
| Third-party scripts | None that access health data |

**Honest limitations:**
- Browser storage can be cleared by the user or browser updates
- A simple discreet mode reduces visible information but does not provide security
- This is a hackathon prototype, not a production healthcare application
- No clinical validation, regulatory compliance, or security audit has been performed

---

## Demo Walkthrough

1. Open the app → Welcome screen appears
2. Click **"Load demo data (Maya, fictional)"** to load 31 synthetic check-ins
3. **Overview**: See stats, recent entries, and key insights
4. **Journal**: Browse entries, search, add a new check-in, edit or delete
5. **Timeline & Insights**: Filter by date/symptom, explore charts, read insights with supporting data
6. **Appointment Prep**: Answer 6 questions → generate editable summary → print/copy
7. **Privacy & Data**: Export JSON, import, or delete all data

---

## Sources

### Preventive Care
- Cervical Screening: [Australian Government — National Cervical Screening Program](https://www.health.gov.au/topics/cervical-screening)
- Breast Screening: [BreastScreen Australia](https://www.health.gov.au/initiatives-and-programs/breastscreen-australia)

### Learning Content
- [NHS — Self-help for CFS/ME](https://www.nhs.uk/conditions/chronic-fatigue-syndrome-cfs-me/self-help/)
- [AHRQ — Patient Involvement](https://www.ahrq.gov/patients-consumers/patient-involvement/index.html)
- [WHO — Patient Safety](https://www.who.int/news-room/fact-sheets/detail/patient-safety)
- [Mayo Clinic — Medical Appointments](https://www.mayoclinic.org/healthy-lifestyle/consumer-health/in-depth/medical-appointments/art-20048236)

---

## Testing

### What has been tested
- ✅ TypeScript compilation — zero errors
- ✅ Production build — successful
- ✅ Dev server startup and page serving
- ✅ All routes render without crashes
- ✅ Demo data loading
- ✅ Journal CRUD (add, edit, delete entries)
- ✅ Chart rendering from actual data
- ✅ Insight generation with deterministic rules
- ✅ Consultation summary generation and editing
- ✅ Export/import JSON with validation
- ✅ Delete all data with confirmation
- ✅ Discreet mode toggle
- ✅ Mobile responsive layout

### Manual test instructions
1. Run `npm run dev`
2. Load demo data from onboarding or Privacy page
3. Add a new check-in → verify it appears in journal and timeline
4. Edit the entry → verify changes persist after page refresh
5. Delete the entry → verify it disappears
6. Open Timeline → check that charts show correct data
7. Open Insights tab → verify observations reference real entries
8. Complete Appointment Prep → verify summary includes recorded data
9. Export data → verify valid JSON file downloads
10. Delete all data → verify app returns to onboarding

---

## Known Limitations

- **Not a medical device.** No clinical validation or regulatory review.
- **No AI features.** The architecture supports optional AI adapters, but none are implemented.
- **No cloud sync.** Data exists only in the current browser.
- **No user authentication.** Anyone with browser access can see the data.
- **Chunk size.** Single JS bundle (~739 KB). Could be code-split for production.
- **No automated test suite.** Logic is testable but unit tests are not yet written.
- **Limited preventive care.** Only 2 jurisdiction-specific items (Australia) plus general prompts.
- **No offline PWA.** Works offline after load but is not a registered service worker.

---

## Future Improvements

- Unit and integration tests for observation rules and DB operations
- Code splitting for smaller initial load
- PWA with service worker for true offline support
- Cloud sync option with encryption (requires auth, security review)
- Additional preventive care jurisdictions
- Optional AI drafting with explicit consent and adapter pattern
- Accessibility audit (WCAG 2.1 AA)
- Context transition/handover view

---

## License

Built for recHERsion'26 hackathon. All demo data is fictional.
