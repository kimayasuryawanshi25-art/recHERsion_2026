# HerHealth Companion — Project Analysis & Progress Report

**Project Name:** HerHealth Companion (Life-Stage Women's Health Companion)  
**Repository:** [recHERsion_2026](https://github.com/kimayasuryawanshi25-art/recHERsion_2026.git)  
**Event:** recHERsion'26 Hackathon  
**Report Date:** October 24, 2026  
**Status:** MVP Fully Functional & Configured

---

## 1. Executive Summary & Vision

**HerHealth Companion** is a privacy-first personal health information organizer designed specifically for women navigating various life stages (menstrual health, irregular cycles, pregnancy/postpartum, perimenopause/menopause, and general wellbeing). 

### Core Value Proposition
> *"Turn scattered health records into a clear story you can take to your doctor — without the app diagnosing you or sharing your information without your permission."*

The application addresses the common dilemma where women's health symptoms are fragmented across physical notes, calendar entries, and memory, making clinical consultations rushed or incomplete. Crucially, the app operates under **strict non-diagnostic, ethical boundaries** — acting solely as an organization and synthesis tool rather than a diagnostic or clinical prediction engine.

---

## 2. Technical Stack & Infrastructure

The project is architected as a **pure client-side single page application (SPA)** with zero external server dependencies, zero third-party telemetry, and zero mandatory cloud services.

| Layer | Technology | Details & Role |
| :--- | :--- | :--- |
| **Framework** | **React 19** (`^19.3.1`) | Modern functional components with hooks (`useState`, `useEffect`, `useMemo`, `useRef`) |
| **Language** | **TypeScript 6** (`~6.0.3`) | Strict type definitions across health data models and database schemas |
| **Build Tool** | **Vite 8** (`^8.3.4`) | High-performance bundling and Fast Refresh dev environment |
| **Styling** | **Tailwind CSS v4** (`^4.3.3`) + Vanilla CSS | Custom organic palette: `plum` (#7c6385), `rose` (#b66c77), `teal` (#5e806a), and `sand` (#fbfaf7) |
| **Data Storage** | **IndexedDB** via `idb` (`^8.0.4`) | Asynchronous, persistent, in-browser structured NoSQL database (`herhealth-companion`) |
| **Visualizations** | **Recharts** (`^3.10.1`) | Interactive Bar charts, Line charts, and category distribution graphs |
| **Routing** | **React Router DOM v7** (`^7.18.4`) | Declarative client-side routing with route guards |
| **Icons** | **Lucide React** (`^1.61.0`) | Modern SVG icon set |
| **Identifiers** | **UUID v4** (`^14.0.3`) | Unique client-generated IDs for entries and observations |
| **Linter** | **Oxlint** (`^1.88.0`) | High-speed Rust-based linter |

---

## 3. Repository Commit History & Evolution

Analysis of git commits reveals structured, incremental development:

1. **Commit `aa9ccc6` — *initialzing project***
   - Project initialization and scaffolding.
   - Core data structures, schemas, and IndexedDB layer (`src/lib/db/index.ts`).
   - Implementation of primary views: Onboarding, AppShell, Overview, Journal (list & form), Timeline & Charts, Consultation Prep, Preventive Care, Learning Library, and Privacy.
   - Integration of deterministic observation rules engine (`src/lib/observations/index.ts`).
   - Fictional synthetic demo persona dataset ("Maya", 31 check-ins across 8 weeks).

2. **Commit `0f32b5f` — *initialize project***
   - Comprehensive documentation in `README.md`.
   - Detailed problem statement, MVP feature catalog, architecture diagrams, privacy disclosures, testing checklists, and future roadmap.

3. **Commit `5ac0873` — *added setting page***
   - Creation of `SettingsPage.tsx` for dedicated profile and privacy preferences.
   - Upgraded `AppShell.tsx` navigation sidebar with settings route, discreet mode toggle, and responsive mobile drawer.
   - Added user profile customization (`displayName`) to `UserSettings` type and database schema.
   - Polished layout and styling across consultation and journal screens.

4. **Commit `4bfbc73` — *index.css file updated***
   - Refinements to Tailwind CSS variables, theme classes, card styling, and print stylesheets (`@media print`).

---

## 4. Complete Architecture & Directory Structure

```
recHERsion_2026/
├── public/
│   ├── favicon.svg             # App favicon
│   └── icons.svg               # SVG icons
├── src/
│   ├── assets/                 # Brand assets & images (hero.png, vite.svg, react.svg)
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx    # Desktop sidebar, mobile header/drawer, discreet mode toggle
│   │   └── ui/
│   │       ├── ConfirmDialog.tsx # Accessible modal for destructive/action confirmations
│   │       └── PageHeader.tsx    # Reusable section heading with action slots
│   ├── data/
│   │   ├── demo-data.ts        # 31 realistic synthetic check-ins for persona "Maya (age 44)"
│   │   ├── learning-content.ts # 6 cited educational cards (NHS, WHO, AHRQ, Mayo Clinic)
│   │   └── preventive-items.ts # Evidence-backed preventive screening guidance
│   ├── features/
│   │   ├── consultation/
│   │   │   └── ConsultationPage.tsx # 6-step clinical prep interview & print/export summary
│   │   ├── journal/
│   │   │   ├── EntryForm.tsx   # Add/Edit symptom check-in with validation & autocomplete
│   │   │   └── JournalPage.tsx # Searchable, filterable list of recorded entries with CRUD
│   │   ├── learning/
│   │   │   └── LearningPage.tsx # Educational cards on symptom journaling & communication
│   │   ├── onboarding/
│   │   │   └── OnboardingPage.tsx # Multi-step welcome, ethical boundaries & context selection
│   │   ├── overview/
│   │   │   └── OverviewPage.tsx # KPI summary stats, recent check-ins, automated insights
│   │   ├── preventive/
│   │   │   └── PreventivePage.tsx # Screening recommendations & doctor visit checklists
│   │   ├── privacy/
│   │   │   └── PrivacyPage.tsx # Storage transparency, JSON export/import, factory reset
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx # Local profile name, discreet mode switch, backup tools
│   │   └── timeline/
│   │       └── TimelinePage.tsx # Recharts visualizations, date/symptom filters, observations
│   ├── lib/
│   │   ├── db/
│   │   │   └── index.ts        # idb IndexedDB wrapper (CRUD, clear, export, merge/replace import)
│   │   └── observations/
│   │       └── index.ts        # Pure deterministic rules engine generating clinical insights
│   ├── types/
│   │   └── health.ts           # Schema models (SymptomEntry, UserSettings, ConsultationSummary, etc.)
│   ├── App.tsx                 # Root component, router config, route protection, periodic state sync
│   ├── index.css               # Design tokens, palette variables, card styles, print media query
│   └── main.tsx                # React DOM root entry point
├── package.json                # Dependencies, project metadata, scripts
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # Client app TypeScript compilation options
└── vite.config.ts              # Vite + React plugin configuration
```

---

## 5. Comprehensive Breakdown of What Has Been Done

### 1. Onboarding & Context Selection (`OnboardingPage.tsx`)
- **Step 0 — Welcome & Guardrails:** Clear statement of app capabilities alongside an explicit disclaimers box detailing what the app does **not** do (no diagnosis, no automated risk scoring, no medical advice).
- **Step 1 — Privacy & Offline Architecture:** Transparent explanation that data is kept 100% on the local device with no cloud transmission.
- **Step 2 — Health Context Selection:** Users select applicable contexts (Menstrual Health, Irregular Cycles, Pregnancy & Postpartum, Midlife Changes, Later-Life Wellbeing, General Wellbeing).
- **One-Click Demo Loading:** Instant setup button injecting synthetic data for demonstration without manual entry.

### 2. AppShell & Navigation Architecture (`AppShell.tsx`)
- **Dual-mode Navigation:** Responsive desktop sticky sidebar + mobile slide-out navigation.
- **Discreet Mode:** One-tap toggle transforming the app identity to neutral *"Health Notes"* and renaming sensitive section labels to prevent shoulder-surfing in public.
- **Quick Action CTA:** Prominent "New Check-in" button accessible globally.

### 3. Overview Dashboard (`OverviewPage.tsx`)
- **KPI Metrics Cards:** Automatically calculates:
  - Total recorded check-ins
  - Number of distinct symptoms tracked
  - Unique calendar days covered
  - Total active date span (e.g., Aug 4 – Sep 27)
- **Recent Activity Feed:** Shows latest 5 check-ins with severity indicators and quick links to edit.
- **Key Insights Preview:** Surfaces the top 3 algorithmic observations directly on the dashboard.
- **Friendly Empty State:** Guides new users to add their first check-in or load demo data.

### 4. Symptom & Wellbeing Journal (`JournalPage.tsx` & `EntryForm.tsx`)
- **Full CRUD Operations:** Add, read, update, and delete symptom check-in records.
- **Live Search & Filtering:** Case-insensitive search filtering across symptom names, notes, and dates.
- **Comprehensive Data Capture:**
  - Date and optional timestamp
  - Symptom name with dynamic suggestion pills for common symptoms
  - Color-coded severity rating (1 = Minimal, 2 = Mild, 3 = Moderate, 4 = Severe, 5 = Very severe)
  - Wellbeing sliders: Mood (1–5), Energy (1–5), Sleep Quality (1–5)
  - Daily impact description (how the symptom disrupted work, exercise, sleep, or routine)
  - Free-form notes and recorded medications
  - Associated health context tags
- **Safe Deletion:** Reusable `ConfirmDialog` prevents accidental data loss.

### 5. Timeline & Interactive Data Visualizations (`TimelinePage.tsx`)
- **Multi-parameter Filtering:** Filter by date range (start date to end date) and specific symptom dropdown.
- **Three Dedicated Views:**
  1. **Timeline Feed:** Chronological cards detailing each entry's metrics and impact.
  2. **Visual Charts (Recharts):**
     - *Symptom Frequency Bar Chart:* Highlights most common symptoms.
     - *Severity Trend Line Chart:* Visualizes symptom intensity trajectories over time.
     - *Wellbeing Dynamics Line Chart:* Independent tracking lines for Sleep, Mood, and Energy (never conflated into a single misleading score).
     - *Daily Impact Summary:* Proportional visual ratio of entries causing functional life disruption.
  3. **Insights Feed:** Expandable cards displaying automated observations with source records.

### 6. Explainable Deterministic Observations Engine (`src/lib/observations/index.ts`)
A dedicated, transparent rules engine that converts raw journal records into structured, factual observations:
- **Rule 1 (`entry-count`):** Check-in frequency relative to total elapsed calendar span.
- **Rule 2 (`symptom-frequency`):** Top 5 recorded symptoms sorted by occurrence.
- **Rule 3 (`severity-summary`):** Mathematical average, score range, and count of high-severity (4–5) entries.
- **Rule 4 (`wellbeing-impact`):** Aggregation of poor sleep, low mood, low energy, and functional disruption.
- **Rule 5 (`co-occurrence`):** Analysis of multiple symptoms recorded on the same date (with strict disclaimer: *"describes same-day recording; does not imply medical causation"*).
- **Rule 6 (`missing-info`):** Audits optional field completion to identify gaps in self-reporting.
- **Evidence-Linked:** Every observation contains `supportingEntryIds`, the evaluated `dateRange`, and explicit limitations.

### 7. Appointment Preparation & Consultation Summary (`ConsultationPage.tsx`)
- **6-Question Guided Clinical Wizard:**
  1. *What has changed recently?*
  2. *Which symptoms concern you most?*
  3. *When did you first notice the change?*
  4. *How has it affected your daily activities?*
  5. *Any relevant medicines, appointments, or records?*
  6. *What questions would you like to ask your healthcare professional?*
- **Automated Summary Synthesis:** Merges qualitative interview responses with quantitative IndexedDB data (symptom counts, severity averages, sleep/mood notes).
- **Editable Clinical Handout:** Interactive editable textarea allowing the user to refine the final text before seeing the doctor.
- **Export & Print Capabilities:** One-click copy-to-clipboard and formatted browser print layout (`@media print` removes navigation bars and buttons for clean paper/PDF export).
- **Prominent Medical Disclaimer:** Header explicitly states: *"This is user-provided information, not a diagnosis or medical assessment."*

### 8. Preventive Care Guide (`PreventivePage.tsx`)
- Verified preventive screening guidance including Cervical Screening and Breast Screening with direct links to government health sources (Australian Department of Health & BreastScreen Australia).
- Actionable preparation guides: Appointment logs, doctor question checklists, and personal care tracking.

### 9. Learning Library (`LearningPage.tsx`)
- 6 bite-sized educational cards with accredited citations (NHS, WHO, AHRQ, Mayo Clinic) covering:
  - How to keep an effective health diary.
  - Communicating change over time rather than isolated symptom snapshots.
  - Formulating questions for doctors.
  - Capturing functional daily life impacts.
  - Understanding digital tool limitations.

### 10. Privacy, Data Sovereignty & Settings (`PrivacyPage.tsx` & `SettingsPage.tsx`)
- **100% Local Storage:** Complete IndexedDB persistence (`symptomEntries`, `settings`, `consultations`).
- **Complete Data Backup (JSON Export):** Standardized JSON export timestamped with schema version 1.0.0.
- **Schema-Validated Import:** Supports both **"Merge"** (preserving existing records) and **"Replace"** (clean restore) with error handling.
- **Factory Reset / Purge:** Complete local data erasure with safety confirmation.
- **Persona Simulator:** Ability to reset and load fictional test data for Maya (age 44).
- **Local User Preferences:** Configurable display name and discreet mode persistence.

---

## 6. Data Model & Schema Reference (`src/types/health.ts`)

```typescript
// Core Symptom Record
export interface SymptomEntry {
  id: string;                    // UUID v4
  date: string;                  // YYYY-MM-DD
  time?: string;                 // HH:mm
  symptom: string;               // Normalized symptom title
  severity?: 1 | 2 | 3 | 4 | 5;  // 1-5 self-reported scale
  mood?: number;                 // 1-5 scale
  energy?: number;               // 1-5 scale
  sleepQuality?: number;         // 1-5 scale
  dailyImpact?: string;          // Qualitative life impact
  notes?: string;                // Contextual user notes
  medications?: string;          // Medications/supplements taken
  contexts: HealthContextId[];   // Associated life stages
  createdAt: string;             // ISO Timestamp
  updatedAt: string;             // ISO Timestamp
}

// User Configuration
export interface UserSettings {
  id: string;                    // 'user-settings'
  selectedContexts: HealthContextId[];
  onboardingComplete: boolean;
  discreetMode: boolean;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

// Consultation Summary Record
export interface ConsultationSummary {
  id: string;
  whatChanged: string;
  mainConcerns: string;
  firstNoticed: string;
  dailyImpact: string;
  relevantRecords: string;
  questionsForDoctor: string;
  selectedEntryIds: string[];
  generatedText: string;
  editedText: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 7. Current Project Health & Environment Status

- **Code Quality:** All code is written in clean, idiomatic TypeScript with React 19 best practices.
- **Dependency State:** The repository has just been cloned; running `npm install` installs all locked dependencies from `package-lock.json`.
- **Offline Capability:** Fully client-side; does not require network access once loaded into the browser.
- **Security & Privacy:** No trackers, analytics, or third-party cloud connections. Data never leaves the browser profile.

---

## 8. Summary of Completed vs. Future Roadmap

| Area | Completed Features | Potential Future Enhancements |
| :--- | :--- | :--- |
| **Data Capture** | Full CRUD for symptoms, severity, mood, sleep, energy, meds, notes | Voice-to-text input, menstrual cycle calculation utilities |
| **Insights** | 6 deterministic, explainable observation rules with zero hallucination | Multi-month trend velocity analysis, seasonal correlations |
| **Clinical Prep** | 6-step guided interview, synthesized text, print-to-PDF, copy to clipboard | PDF export via jsPDF, pre-formatted clinical intake questionnaire |
| **Privacy & Storage**| IndexedDB local storage, JSON backup export, merge/replace import, full purge | Web Cryptography API password protection, Service Worker PWA |
| **Education** | 6 educational cards & preventive health guidelines with official citations | Expanded jurisdiction-specific guidelines (NHS UK, CDC US) |
