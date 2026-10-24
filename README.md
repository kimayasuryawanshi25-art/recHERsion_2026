# HerHealth Companion 🌸


> *"Turn scattered health records into a clear, empowering story you can take to your doctor — without algorithms diagnosing you, estimating risk scores, predicting diseases, or leaking personal data."*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20%7C%20Strict-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black)](https://fastify.dev/)
[![LibSQL](https://img.shields.io/badge/Database-LibSQL%20%2F%20SQLite-003B57)](https://turso.tech/libsql)
[![AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-green)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-ff69b4)](https://web.dev/progressive-web-apps/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-purple)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests Passing](https://img.shields.io/badge/Tests-78%2F78%20Passing-brightgreen)](https://github.com/recHERsion/recHERsion_2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚕️ Important Medical & Safety Disclaimer

> [!IMPORTANT]
> **HerHealth Companion is an educational personal health information organizer, NOT a diagnostic medical device or clinical triage system.**
> - All observations, timelines, comparisons, and consultation summaries are derived strictly from user self-reported check-ins.
> - The application **never diagnoses**, **never predicts diseases**, **never ranks probable conditions**, **never calculates risk scores or BMI**, **never prescribes or changes medications**, and **never offers false reassurance** (*"nothing to worry about"*).
> - Default safe guidance: *"If you are worried, speak to a health professional."*
> - In any life-threatening emergency, call **000** (Australia) or your local emergency department immediately.

---

## 🎯 The Problem: Why HerHealth Companion Exists

Women often face significant barriers when navigating the healthcare system:
1. **Medical Gaslighting & Fragmented Records**: Symptoms like chronic pelvic pain, fatigue, perimenopausal shifts, and cycle irregularities are frequently dismissed or lost across disparate paper notes, apps, and memories.
2. **Predictive AI Black Boxes**: Mainstream health apps attempt to calculate "risk scores", predict fertility, or guess medical diagnoses. When incorrect, these models cause panic or false reassurance.
3. **Surveillance Capitalism in FemTech**: Millions of users' intimate reproductive histories are harvested, sold to data brokers, or leaked.

### Our Solution
**HerHealth Companion** is a local-first, privacy-centric health narrative engine. It empowers women to track symptoms, organize medical records, evaluate non-diagnostic clinical red flags, prepare for 15-minute GP appointments, and advocate for their own care — completely offline and securely encrypted.

---

## 🌟 Core Pillars & Architectural Principles

| Pillar | Principle | Implementation |
|---|---|---|
| **🔒 Local-First by Default** | Zero mandatory accounts or cloud dependencies | 100% operational in IndexedDB (idb v5) out of the box with zero internet connection. |
| **⚖️ Explicit Null Semantics** | Missing data is never guessed | Unrecorded values remain explicit `null` ("Not recorded"), never auto-filled to `0` or inferred. |
| **📐 Deterministic Logic** | Zero black-box AI diagnostic inference | All insights and observations are rule-based with public `ruleId`, `version`, `coverage`, and `limitation`. |
| **🛡️ Descriptive Wording Linter** | Banned clinical assertion terms | Automated AST and string linting prohibits: `diagnosis`, `disease`, `disorder`, `abnormal`, `you have`, `you are at risk`, etc. |
| **🔐 Zero Health-Data Logging** | Server audit streams never touch clinical text | Only generic action verbs and IDs (`sync_push_completed`) are logged. Notes and health data are never logged. |
| **🔑 Field-Level AES-256-GCM** | Multi-tenant zero-knowledge synchronization | Free-text notes, medicines, and debriefs are encrypted with AES-256-GCM prior to database persistence. |

---

## 🚀 Complete Feature Index (Phases 1–18)

### 1. 📋 Personal Health Profile ("About Me")
- **10 Living Clinical Sections**:
  1. *Basics & Identity* (Name, preferred pronouns, birth year, state/country).
  2. *Reproductive Status & Cycle History* (Cycle regular/irregular/perimenopausal/menopausal/pregnant, menarche age, typical length).
  3. *Gynaecological History* (PCOS, endometriosis, fibroids, adenomyosis history as self-reported).
  4. *Chronic Health Conditions* (Thyroid, autoimmune, hypertension, migraines, diabetes).
  5. *Surgeries & Procedures* (Laparoscopy, caesarean, IUD insertion/removal, appendectomy with dates).
  6. *Medications & Supplements* (Dosage, frequency, purpose, refill reminders).
  7. *Allergies & Sensitivities* (Drug allergies, latex, food, seasonal, severity).
  8. *Family Health History* (Maternal/paternal breast cancer, ovarian cancer, cardiovascular, osteoporosis).
  9. *Lifestyle & Everyday Context* (Sleep routine, physical movement, occupational factors, stress markers).
  10. *Care Preferences & Accommodations* (Chaperone requests, trauma-informed preferences, accessibility needs).
- **"Why We Ask" Educational Rationales**: Clear, non-judgmental explanations for every question grounded in RACGP and RANZCOG clinical standards.
- **Strict Null Safety**: Clear UI differentiation between *"Not recorded"*, *"No/None"*, and confirmed values.

### 2. 🧭 Care Navigator (Deterministic Triage & Clinical Questioning)
- **4-Tier Non-Diagnostic Urgency Assessment**:
  - 🔴 **Emergency (Immediate 000 / Hospital ED)**: Severe acute pelvic pain, heavy bleeding with presyncope/fainting, shortness of breath, bleeding in pregnancy.
  - 🟠 **Urgent (12–24 Hours / Walk-in GP Clinic)**: Bleeding soaking $>2$ pads/hour for 2 hours, high fever with pelvic pain, severe unrelenting pain.
  - 🟡 **Routine (1–2 Weeks / Scheduled GP Appointment)**: Gradual cycle irregularities, persistent fatigue, recurring pain patterns, transition questions.
  - 🟢 **Self-Care & Structured Tracking**: Mild transient symptoms, lifestyle adjustments, continued diary logging.
- **Personalized "What to Ask Your Clinician" Checklist**: Generates targeted questions for the doctor based on reported symptoms, with a one-click copy button.
- **Verifiable Public Guidelines**: Every assessment rule displays an authoritative source (WHO, Healthdirect, RACGP) with `sourceUrl` and `verifiedOn` timestamp.

### 3. 🗺️ Care Finder & Verified Clinic Directory
- **Specialized Provider Categories**: General Practice (GP), Bulk-Billing Clinics, Women's Health & Gynaecology Specialists, 24/7 Hospital Emergency Departments, Community Health Centres.
- **Verified Badges**: Clinics carry verified badges with `sourceUrl` and date of verification.
- **24/7 Australian Crisis Helplines**:
  - Emergency: **000**
  - Domestic & Family Violence: **1800RESPECT (1800 737 732)**
  - Mental Health & Crisis: **Lifeline (13 11 14)** | **Beyond Blue (1300 22 4636)**
  - Perinatal Anxiety & Depression: **PANDA (1300 726 306)**
  - First Nations Crisis Line: **13YARN (13 92 76)**
  - LGBTIQA+ Support: **QLife (1800 184 527)**
  - Healthdirect Registered Nurse Line: **1800 022 222**
- **Double-Confirmed Trusted Contact Alert**: Pre-drafted, calm message (*"Hi [Name], I am using my health organizer app and wanted to let you know I may need some support right now. Could you check in on me?"*) with double-confirmation dialog to prevent accidental triggers.

### 4. 🔄 3-Stage Active Appointment Loop
- **Stage 1: Before Visit (Prepare)**:
  - 6-question structured clinical prep interview.
  - Chronological symptom timeline and functional impact highlights.
  - Vector PDF export for the doctor.
- **Stage 2: During Visit (In-Consultation Checklist & Notes)**:
  - Interactive live checklist of priority questions during the 15-minute consult.
  - Fast-action scratchpad for typing or noting clinician responses in real time.
- **Stage 3: After Visit (Debrief, Medication Refills & Follow-Ups)**:
  - Structured debrief recording clinician explanations, ordered pathology/ultrasounds, and prescription adjustments.
  - Action items with status checkboxes and due dates (e.g., *"Book pelvic ultrasound"*, *"Repeat blood tests in 6 weeks"*).
  - Medication refill tracking with alert badges when $\le 2$ refills remain.

### 5. 🩺 Clinician Read-Only Brief (4-Quadrant Rapid Scan)
- **4-Quadrant Layout Tailored for 10-Minute GP Consults**:
  1. *Quadrant 1: Primary Concerns & Timing* (Symptom duration, frequency, onset dates).
  2. *Quadrant 2: Daily Functional Impact* (Work, physical activity, sleep, emotional wellbeing).
  3. *Quadrant 3: Recorded Health Background* (Current medicines, allergies, surgeries, family history).
  4. *Quadrant 4: Priority Patient Questions* (Pre-formulated questions the user wishes to discuss).
- **Clinician Privacy Safeguards**: Accessible via `/c/:token` or `/s/:token`, enforces `X-Robots-Tag: noindex, nofollow, noarchive`, supports instant link revocation, and includes clean print/PDF styling.

### 6. 🎥 Simulated Teleconsultation Mode (Rule 11 Advocacy Rehearsal)
- **Safe Rehearsal Space**: Dedicated rehearsal page (`/teleconsult`) allowing users to practice articulating concerns before their real doctor's appointment.
- **Prominent Rehearsal Banner**: Permanent banner clearly states *"SIMULATION / ADVOCACY PRACTICE ONLY — NOT REAL MEDICAL CARE"*.
- **Interactive Advocacy Prompts**: Timed 60-second opening statement rehearsal (*"Lead with your most severe functional impact"*).

### 7. 🗄️ Local Encrypted Records Vault
- **Client-Side Document Organization**:
  - Securely stores medical records directly in browser IndexedDB (`recordsVault`).
  - Categorization: *Pathology / Blood Test*, *Ultrasound / Imaging*, *Specialist Letter*, *Prescription*, *Other*.
  - Metadata tracking: Document title, provider/lab name, date of test, clinical notes, and file attachments.
  - Zero cloud leakage: Documents never leave the local browser unless explicitly synced.

### 8. 🎙️ Multi-Language Voice Diary & Journal
- **Web Speech Recognition**:
  - Speech-to-text recording supporting English (`en-AU`), Hindi (`hi-IN`), and Marathi (`mr-IN`).
  - Live animated waveform visualizer and pause/resume recording controls.
- **Mandatory Human-in-the-Loop Review**:
  - Transcriptions are **never** committed directly. A review modal displays the recognized text, allowing the user to inspect, edit, or reject the draft before saving.
- **Compassionate Distress Detection**: Non-blocking banner detects acute distress phrases in notes and presents 24/7 crisis hotlines.

### 9. 📈 Deterministic Cycle & Period Comparison Engine
- **Mathematical Variance Analysis**:
  - Compares current cycle length (days), flow days, and cramp severity against historical baseline.
  - Flags variation without assigning medical labels (e.g. *"Cycle length was 4 days longer than your recorded 3-cycle average"*).
  - Sleep and energy impact correlations.

### 10. 💬 Weekly Reflection & Self-Advocacy Card Deck
- **Empowering Patient Communication**:
  - Interactive cards containing clinically endorsed discussion phrasing (e.g., *"How does this investigation help clarify my symptoms?"*, *"Can you document that this was discussed in my clinical notes?"*).
  - One-click copy buttons for instant use during consultations.

### 11. 🌐 Multi-Language Architecture (English, हिन्दी, मराठी)
- **Cultural & Linguistic Inclusivity**:
  - Comprehensive translation dictionaries covering navigation, forms, safety alerts, and disclaimers in English, Hindi, and Marathi.
  - Dynamic language selector in header and mobile drawer.
  - Automatic `document.documentElement.lang` binding for assistive screen readers.

### 12. ♿ WCAG 2.1 AA Accessibility & Keyboard Navigation
- **Assistive Technology Ready**:
  - Skip-to-content bypass link (`#main-content`) for keyboard-only users.
  - Semantic HTML5 landmarks (`role="main"`, `role="menu"`, `aria-live="polite"`).
  - Color contrast ratios exceed WCAG AA standards (4.5:1 for body text, 3:1 for interactive elements).
  - Reduced-motion friendly animations.

### 13. 📱 Progressive Web App (PWA) Offline Capability
- **100% Offline Resilience**:
  - Web App Manifest (`manifest.json`) supporting home-screen installation.
  - Cache-first Service Worker (`sw.js`) caching all application assets.
  - All core tracking, Care Navigator rules, crisis phone numbers, and About Me records function seamlessly with zero cellular or Wi-Fi connectivity.

### 14. 🛡️ Safety Features, Discreet Mode & Quick Escape
- **Quick Escape Button & `Esc` Key**: Instant redirect to `https://www.bom.gov.au` (Bureau of Meteorology) with immediate session clearing.
- **Discreet Mode**: Replaces sensitive gynaecological labels with generic terms (e.g., *"Health Notes"* instead of *"HerHealth Companion"*).
- **PBKDF2 PIN Lock**: Local 4–6 digit PIN hashed with 100,000 PBKDF2 iterations using WebCrypto. Automatically locks after 5 minutes of inactivity.
- **Urgent Care Header Button**: Red one-click access to red-flag symptoms and emergency numbers.

### 15. 🤖 Optional AI Consultation Scribe (Consent-Gated)
- **Strictly Opt-In**: Requires explicit user consent before activation.
- **Zero Raw Data Leaking**: Only user-selected symptom entries are passed to the scribe.
- **Hard Wording Guardrails**: System prompt strictly mandates non-diagnostic summarizing. If the model emits any prohibited clinical term, `lintWording()` automatically catches it and falls back to deterministic summary generation.

---

## 🏛️ Monorepo Architecture

```
recHERsion_2026/
├── shared/                         # @rechersion/shared (Universal domain logic, zero runtime dependencies)
│   ├── src/
│   │   ├── schemas/                # Strict Zod schemas (profile, debrief, navigator, appointment, etc.)
│   │   ├── rules/                  # Deterministic observation rules (menstrual, wellbeing, cycle-comparison)
│   │   │   ├── cycle/              # Cycle length and cramp variance engine
│   │   │   ├── preventive/         # Australian preventive screening pack (au.json)
│   │   │   └── wording-lint.ts     # Objective phrasing linter & banned clinical terms scanner
│   │   └── types/                  # Universal TypeScript interfaces
│   └── tests/                      # 28 tests (rules, preventive, cycle comparison, navigator, i18n wording)
│
├── server/                         # @rechersion/server (Optional Fastify sync & cloud backend)
│   ├── src/
│   │   ├── db/                     # Drizzle ORM schema (profile, debriefs, followups, appointments, vault)
│   │   ├── services/
│   │   │   ├── crypto.service.ts   # AES-256-GCM field encryption & Argon2id password hashing
│   │   │   ├── summary.service.ts  # Consultation summary compiler & vector PDFKit generator
│   │   │   └── ai.service.ts       # Consent-gated Anthropic Messages API scribe
│   │   ├── routes/                 # Fastify REST endpoints (profile, navigator, finder, debrief, share, sync)
│   │   └── plugins/                # CSRF protection, session cookies, rate-limiting, security
│   └── tests/                      # 14 test suites with 50 passing tests covering all routes and security
│
├── src/                            # Frontend Web Client (React 19 + Vite + Tailwind v4 + PWA)
│   ├── components/
│   │   ├── layout/AppShell.tsx     # Navigation shell with Language Selector, Quick Escape & Urgent Care
│   │   └── ui/                     # PinLockModal, UrgentCarePanel, QuickEscapeButton, SyncStatusBadge
│   ├── features/
│   │   ├── profile/                # Personal Profile ("About Me") with 10 living sections
│   │   ├── navigator/              # Care Navigator deterministic triage & clinician checklist
│   │   ├── finder/                 # Care Finder directory, crisis helplines & trusted contact alert
│   │   ├── journal/                # Voice Diary (EN/HI/MR) & CRUD journal with distress detection
│   │   ├── timeline/               # Interactive Recharts, Cycle-to-Cycle comparison & Self-Advocacy cards
│   │   ├── consultation/           # 3-Stage Appointment Loop (Prep, Checklist, Debrief & Follow-Ups)
│   │   ├── teleconsult/            # Simulated Teleconsultation advocacy rehearsal (Rule 11)
│   │   ├── vault/                  # Local Encrypted Records Vault (IDB store with category filtering)
│   │   ├── preventive/             # Australian preventive care tracking linked with health history
│   │   └── settings/               # Discreet mode, PIN lock, and cloud sync/auth
│   └── lib/
│       ├── db/                     # IndexedDB v5 wrapper (outbox, symptomEntries, recordsVault)
│       ├── i18n/                   # Multi-language translation dictionaries & context (EN, HI, MR)
│       ├── sync/                   # Background sync engine with exponential backoff
│       └── safety/                 # Crisis keywords (000, Lifeline) and PBKDF2 PIN lock
│
├── public/                         # PWA Web App Manifest (manifest.json) & Service Worker (sw.js)
├── Dockerfile                      # Production client container
├── docker-compose.yml              # Local-first full stack composition
└── server/Dockerfile               # Production Fastify container
```

---

## 🧪 Automated Test Suite (78 Tests Passing)

Every core rule, schema, security handler, and UI logic pathway is validated through automated Vitest suites:

```bash
# Run all tests across the monorepo
npm test
```

### Coverage Breakdown

| Package | Test File | Tests | Focus Area |
|---|---|---|---|
| `@rechersion/shared` | `rules.test.ts` | 9 | Severity rules, co-occurrence, explicit null guards |
| `@rechersion/shared` | `preventive.test.ts` | 7 | Australian screening guidelines & eligibility state machines |
| `@rechersion/shared` | `navigator.test.ts` | 7 | Deterministic red-flag triage, emergency tiers, question generator |
| `@rechersion/shared` | `cycle-comparison.test.ts` | 3 | Cycle length & cramp variance calculations |
| `@rechersion/shared` | `i18n.test.ts` | 2 | Dictionary completeness & wording linter compliance |
| `@rechersion/server` | `auth.test.ts` | 5 | Multi-tenant Argon2id auth, session tokens |
| `@rechersion/server` | `crypto.test.ts` | 4 | AES-256-GCM encryption, decryption, authentication tags |
| `@rechersion/server` | `sync.test.ts` | 2 | Conflict-free synchronization outbox |
| `@rechersion/server` | `profile.test.ts` | 4 | Living profile sections, dated context events |
| `@rechersion/server` | `navigator.test.ts` | 3 | Triage assessment endpoint & validation |
| `@rechersion/server` | `finder.test.ts` | 5 | Directory lookup, verified badges, helplines |
| `@rechersion/server` | `debrief-followup.test.ts` | 3 | Debrief creation, follow-up checklist updates |
| `@rechersion/server` | `share.test.ts` | 3 | Revocable share tokens, view expiration limits |
| `@rechersion/server` | `summaries.test.ts` | 4 | Vector PDFKit generation, clinician summaries |
| `@rechersion/server` | `ai.test.ts` | 5 | Consent-gating, fallback on banned clinical words |
| `@rechersion/server` | `core-data.test.ts` | 5 | Data validation & isolation |
| `@rechersion/server` | `observations.test.ts` | 4 | Server-side observation persistence |
| `@rechersion/server` | `screening.test.ts` | 1 | Preventive screening record sync |
| `@rechersion/server` | `transitions.test.ts` | 2 | Life-stage transition recommendations |
| **Total** | **19 Test Files** | **78 Passing Tests** | **Zero Failures** |

---

## ⏱️ 5-Minute Judge Demo Walkthrough (The "Maya" Script)

Follow this precise timeline to demonstrate all features to hackathon judges:

### 1. Persona Load & "About Me" Profile (0:00 - 1:00)
- Navigate to **Settings** $\rightarrow$ Click **"Load Demo Data (Maya, age 47)"**.
- Navigate to **About Me** (`/profile`).
- Show Maya's 10 living sections: Perimenopausal status, endometriosis history, regular medications, and family history.
- Highlight the **"Why We Ask"** clinical context cards and strict null preservation (*"Not recorded"* vs *"0"*).

### 2. Multi-Language Voice Diary & Safety Features (1:00 - 2:00)
- Navigate to **Journal** $\rightarrow$ Click **New Check-in**.
- Click the **Voice Diary** microphone button $\rightarrow$ Toggle language between **English**, **हिन्दी (Hindi)**, or **मराठी (Marathi)**.
- Speak a journal entry: observe real-time waveform and the **mandatory human review modal** before saving.
- Type *"overwhelmed and hopeless"* into notes $\rightarrow$ Show the compassionate, non-blocking Australian crisis banner (Lifeline 13 11 14).
- Click the red **Urgent Care** button in the header $\rightarrow$ Inspect the red flags and emergency numbers.
- Press the `Esc` key or click **Quick Escape** $\rightarrow$ Immediate redirect to `bom.gov.au` with session clearance.

### 3. Timeline, Cycle Variance & Self-Advocacy (2:00 - 3:00)
- Open **Timeline & Insights** (`/timeline`).
- Inspect the interactive Recharts timeline and visual gap markers ($>14$ days).
- Review the **Cycle-to-Cycle Comparison** card (e.g. *"Cycle length was 4 days longer than average"*).
- Scroll to the **Self-Advocacy Card Deck** $\rightarrow$ Click to copy an assertive communication phrase for the GP.

### 4. Care Navigator & Care Finder (3:00 - 4:00)
- Navigate to **Care Navigator** (`/navigator`).
- Complete a symptom assessment selecting pelvic pain and fever $\rightarrow$ Observe deterministic **Urgent (12–24h)** triage recommendation with **"What to ask your clinician"** checklist.
- Navigate to **Care Finder** (`/finder`).
- Show verified Indian clinics (AIIMS New Delhi, KEM Mumbai, UPHCs) and national emergency services (112, 181, Tele-MANAS 14416) with public verification badges (`sourceUrl`) for **Demonstration Purpose**.
- Open the **Trusted Contact Alert** modal $\rightarrow$ Show double-confirmation safety flow.

### 5. 3-Stage Appointment Loop, Clinician Scan & Vault (4:00 - 5:00)
- Open **Appointment Prep** (`/consultation`).
  - *Stage 1 (Before)*: Show prepared questions and click **Export PDF** to view the clean vector medical brief.
  - *Stage 2 (During)*: Show the active checklist for marking questions during the doctor's visit.
  - *Stage 3 (After)*: Show the debrief form with follow-up task tracking and medication refill counters.
- Navigate to `/c/:token` or **Clinician View** $\rightarrow$ Show the **4-Quadrant Rapid Scan Layout** designed for 30-second GP review.
- Open **Records Vault** (`/records`) $\rightarrow$ Demonstrate categorized local document storage (Pathology, Imaging, Letters) securely kept on-device.

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js 20+ (tested on Node 22 & 24)
- npm 10+

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/recHERsion/recHERsion_2026.git
cd recHERsion_2026

# 2. Install dependencies across all workspaces
npm install

# 3. Run all tests to verify setup
npm test

# 4. Start the backend sync server (Port 3000)
npm run dev:server

# 5. In a second terminal, start the frontend client (Port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### Docker Deployment

To spin up the entire application stack in isolated production containers:

```bash
docker-compose up --build
```
- **Web Client**: `http://localhost:5173`
- **Fastify Sync Backend**: `http://localhost:3000`

---

## 📋 Clinical Review & Governance Backlog

In compliance with the **Australian Digital Health Agency (ADHA)**, **RACGP**, and **TGA SaMD** guidelines, all clinical content, screening intervals, red-flag triggers, and safety disclaimers are logged in [`CLINICAL_REVIEW_TODO.md`](file:///c:/hack1/r1/recHERsion_2026/CLINICAL_REVIEW_TODO.md) for human medical review:

- **CR-11-01 to CR-11-04**: About Me rationales, ADHA event summary alignment, timeline context markers.
- **CR-12-01 to CR-12-03**: Red flag criteria, triage urgency thresholds, safe default phrasing.
- **CR-13-01 to CR-13-03**: Crisis helpline directory, trusted-contact alert wording, clinic verification standards.
- **CR-14-01 to CR-14-04**: In-consultation checklist, post-visit debrief schema, medication refill alert thresholds.
- **CR-15-01 to CR-15-03**: 4-quadrant GP scan layout, simulated teleconsultation rehearsal scripts, records vault scopes.
- **CR-16-01 to CR-16-03**: Cycle-to-cycle mathematical formulas, voice diary human-in-the-loop review, advocacy phrases.
- **CR-17-01 to CR-17-03**: CALD-compliant Hindi & Marathi safety phrasing, offline emergency cache reliability, WCAG 2.1 AA screen reader standards.

---

## 📄 License


*All persona profiles (Maya) and demo data are completely synthetic and generated for demonstration purposes.*
