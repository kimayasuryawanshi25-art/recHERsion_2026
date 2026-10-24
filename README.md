# HerHealth Companion

> **A privacy-first women's health organizer built for recHERsion '26.**  
> *"Turn scattered health records into a clear story you can take to your doctor — without the app diagnosing you, predicting risks, or sharing your information without permission."*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20%7C%20Strict-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black)](https://fastify.dev/)
[![LibSQL](https://img.shields.io/badge/Database-LibSQL%20%2F%20SQLite-003B57)](https://turso.tech/libsql)
[![AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-green)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚕️ Important Medical & Jurisdiction Disclaimer

> [!IMPORTANT]
> **HerHealth Companion is a personal health information organizer, NOT a diagnostic tool, clinical triage system, or medical device.**
> - All observations, timelines, and appointment summaries are derived strictly from user self-reported check-ins.
> - Preventive screening recommendations are based on an unreviewed sample of Australian national guidelines (RACGP Red Book, NCSP, BreastScreen Australia). **They are provided for demonstration and reference purposes only and have not undergone formal clinical review.**
> - Always consult a registered healthcare provider (such as an Australian General Practitioner or emergency service at **000**) for medical advice, diagnosis, or treatment.

---

## 🌟 Core Pillars & Architectural Principles

1. **Local-First by Default (Zero Account Required)**:
   - 100% functional out of the box with zero internet connection and zero accounts.
   - All check-ins and preferences live locally inside browser **IndexedDB (idb v2)**.
2. **Explicit Nulls & Missing Data Integrity (Rule 1)**:
   - Missing fields are never defaulted to `0` or inferred. If pain or flow was not recorded, it remains an explicit `null` ("not recorded").
3. **Deterministic Observations Engine (Rule 2)**:
   - Observations are calculated deterministically in `@rechersion/shared/rules`.
   - Every observation includes a persistent `ruleId`, `version`, `supportingEntryIds`, data `coverage`, and explicit `limitation`.
4. **Strict Descriptive Wording (Rule 3)**:
   - Prohibits clinical assertions (`diagnosis`, `disorder`, `disease`, `pathology`, `patient`, `abnormal`, `you have`, `you may have`, `this means`, `you are at risk`, `you should take`).
   - Automated pre-commit and runtime linting via `lintWording()`.
5. **Zero Health-Data Logging (Rule 6)**:
   - Server audit trails store non-sensitive action verbs and IDs only (`action: 'sync_push_completed'`, `timestamp`). Health text, symptom names, and notes are **never** logged to server streams or consoles.
6. **Multi-Tenant Field-Level Encryption**:
   - Optional multi-device sync encrypts free-text notes, medication names, and impact descriptions with **AES-256-GCM** before database persistence.

---

## 🏛️ Monorepo Architecture

```
recHERsion_2026/
├── shared/                         # @rechersion/shared (Zero-dependency core logic)
│   ├── src/
│   │   ├── schemas/                # Strict Zod schemas for all domain entities (profile, debrief, navigator, etc.)
│   │   ├── rules/                  # Deterministic observation rules (menstrual, wellbeing, cycle-comparison)
│   │   │   ├── cycle/              # Deterministic cycle & period variance comparison engine
│   │   │   ├── preventive/         # Australian preventive screening guidelines pack (au.json)
│   │   │   └── wording-lint.ts     # Objective phrasing linter & banned terms scanner
│   │   └── types/                  # Universal TypeScript interfaces
│   └── tests/                      # 28 tests (rules, preventive, cycle comparison, navigator, i18n wording)
│
├── server/                         # @rechersion/server (Optional sync & cloud backend)
│   ├── src/
│   │   ├── db/                     # Drizzle ORM schema (profile, debriefs, followups, appointments, vault)
│   │   ├── services/
│   │   │   ├── crypto.service.ts   # AES-256-GCM field encryption & Argon2id hashing
│   │   │   ├── summary.service.ts  # Consultation summary compiler & PDFKit generator
│   │   │   └── ai.service.ts       # Consent-gated Anthropic Messages API scribe
│   │   ├── routes/                 # Fastify REST endpoints (profile, navigator, finder, debrief, share, sync)
│   │   └── plugins/                # CSRF protection, session cookies, rate-limiting, security
│   └── tests/                      # 14 test suites with 50 passing tests covering all routes and security
│
├── src/                            # Frontend Web Application (React 19 + Vite + Tailwind v4 + PWA)
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

## 🌟 Comprehensive 18-Phase Implementation

1. **Phase 0–1**: Monorepo architecture (`shared`, `server`, `client`) and strict non-inferential Zod schemas.
2. **Phase 2–3**: Fastify backend with multi-tenant Argon2id auth and AES-256-GCM field encryption.
3. **Phase 4–5**: Bidirectional background sync engine with IndexedDB outbox queue and conflict resolution.
4. **Phase 6–7**: Deterministic observation engine with explicit limitations, evidence trails, and Australian preventive screening pack (`au.json`).
5. **Phase 8–9**: Clinical consultation summaries, vector PDFKit exports, and cryptographically secure revocable share links (`/s/:token`).
6. **Phase 10**: Safety UI, Quick Escape (`Esc` redirect to `bom.gov.au`), PBKDF2 PIN lock, and optional consent-gated AI medical scribe.
7. **Phase 11**: Personal Profile ("About Me") with 10 living sections, explicit null semantics, timeline context markers, and preventive care history linkage.
8. **Phase 12**: Care Navigator non-diagnostic triage engine (`emergency`, `urgent`, `routine`, `self_care`) with red flags and "What to ask your clinician" checklist.
9. **Phase 13**: Care Finder clinic directory with verified badges (`sourceUrl`, `verifiedOn`), crisis helplines, and double-confirmed trusted-contact alert modal.
10. **Phase 14**: 3-Stage Appointment Care Loop (Before Visit prep, In-Consultation real-time checklist, and After Visit debrief & follow-up tracking with medication refill counters).
11. **Phase 15**: Clinician Read-Only Brief (4-Quadrant rapid scan layout at `/c/:token`), Simulated Teleconsultation mode (advocacy rehearsal under Rule 11), and Local Encrypted Records Vault.
12. **Phase 16**: Multi-language Voice Diary (Web Speech API for EN, HI, MR with mandatory human review), Cycle-to-Cycle comparison engine, and Self-Advocacy card deck.
13. **Phase 17**: Multi-Language support (English, हिन्दी, मराठी), WCAG 2.1 AA Accessibility landmarks & skip link, and Progressive Web App (PWA) offline service worker.
14. **Phase 18**: Monorepo hardening, zero health data leakage audit, clinical review register completion, and production documentation.

---

## 🛡️ Safety & Privacy Features

- **Urgent Care Red Flags**: One-click header access to critical clinical warning signs (severe acute pelvic pain, soaking $\ge 2$ pads/hour for 2 hours, fever $>38.5^\circ\text{C}$, syncope) paired with immediate Australian emergency numbers (**000** and **Healthdirect 1800 022 222**).
- **Compassionate Distress Detection**: Non-blocking banner appears if journal notes mention acute distress or self-harm terms, offering Australian 24/7 crisis support (**Lifeline 13 11 14**, **1800RESPECT 1800 737 732**, **Beyond Blue 1300 22 4636**).
- **Quick Escape Button**: Dedicated header button and `Esc` key shortcut immediately clears `sessionStorage` and replaces the window location with `https://www.bom.gov.au` (Bureau of Meteorology) to protect users in shared or unsafe spaces.
- **WebCrypto PBKDF2 PIN Lock**: Local 4–6 digit PIN hashed with 100,000 rounds of PBKDF2/SHA-256 with a unique cryptographic salt. Automatically locks the screen after 5 minutes of inactivity.
- **Time-Limited Revocable Share Links**: Generate cryptographically random 32-byte share URLs (`/s/:token` and `/c/:token`) for healthcare providers with 1–30 day expirations, view counters (1–10 views), instant revocation, and `X-Robots-Tag: noindex, nofollow, noarchive`.
- **4-Quadrant Clinician Scan**: Rapid 30-second GP scan highlighting Primary Concerns, Daily Functional Impact, Recorded Health Background, and Priority Questions.

---

## 🤖 Optional AI Consultation Scribe (Consent-Gated)

- **Strict User Consent**: AI features are disabled by default and require explicit consent (`ai_summary` consent record).
- **Zero Raw Data Leaks**: Only user-selected check-in records are decrypted and formatted.
- **Non-Diagnostic Guardrails**: Anthropic Messages API runs under strict system instructions:
  > *"You are a medical scribe summarizing self-reported symptom entries for an Australian GP consultation. Write only factual, descriptive summaries. NEVER diagnose, NEVER predict, NEVER prescribe."*
- **Automatic Fallback**: If the external model returns any banned diagnostic terms (flagged by `lintWording()`) or if the network/API key is unavailable, the system automatically falls back to the deterministic summary engine.

---

## ⏱️ 5-Minute Maya Demo Walkthrough

Use this script to demonstrate all capabilities during hackathon evaluations:

1. **Load Persona & Onboarding (0:00 - 1:00)**:
   - Navigate to **Settings** $\rightarrow$ **Load Demo Data (Maya, age 47)**.
   - Observe Maya's self-reported profile: 31 entries over 8 weeks reflecting menstrual cycle irregularities, hot flashes, night sweats, and sleep disturbances.
2. **Review Journal & Voice Diary (1:00 - 2:00)**:
   - Open **Journal** $\rightarrow$ Click **New Check-in** $\rightarrow$ Try the **Voice Diary** in English, Hindi, or Marathi with human confirmation.
   - Type *"overwhelmed and hopeless"* into notes $\rightarrow$ Notice the gentle, non-blocking Australian crisis support card (Lifeline 13 11 14).
   - Click the red **Urgent Care** button in the header $\rightarrow$ Inspect the red-flag symptom guide and emergency hotlines.
3. **Explore Timeline & Cycle-to-Cycle Comparison (2:00 - 3:00)**:
   - Open **Timeline** $\rightarrow$ Review the deterministic Cycle-to-Cycle comparison cards showing cycle length and cramp changes.
   - Copy a pre-formulated **Self-Advocacy Phrase** for your upcoming appointment.
4. **Care Navigator & 3-Stage Appointment Prep (3:00 - 4:00)**:
   - Open **Care Navigator** $\rightarrow$ Run a symptom assessment to receive deterministic urgency guidance and doctor question checklist.
   - Open **Appointment Prep** $\rightarrow$ Prepare visit questions, use the In-Consultation live checklist, and record post-visit debrief with refill alerts.
5. **Clinician View, Security & Quick Escape (4:00 - 5:00)**:
   - Click **Clinician View** or generate a secure share link $\rightarrow$ Review the 4-Quadrant Rapid Scan layout.
   - Switch language via the **Language Selector** (English / हिन्दी / मराठी).
   - Test **PIN Lock** or press `Esc` / click **Quick Escape** $\rightarrow$ Instant redirect to `bom.gov.au`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (tested with Node 22 & 24)
- npm 10+

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/recHERsion/recHERsion_2026.git
cd recHERsion_2026

# 2. Install dependencies across all workspaces
npm install

# 3. Run all unit and integration test suites (78 tests)
npm test

# 4. Start backend server (Port 3000)
npm run dev:server

# 5. In a separate terminal, start frontend web client (Port 5173)
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Docker Deployment

To launch the full containerized environment:

```bash
docker-compose up --build
```
- Web Client: `http://localhost:5173`
- Sync Server: `http://localhost:3000`

---

## 🧪 Automated Test Suite

Run the full monorepo test suite:

```bash
# Run shared and server test suites (78 tests)
npm test

# Run frontend typecheck and linting
npm run typecheck
npm run lint

# Build client and server bundles
npm run build:all
```

**Test Coverage Summary (78 Tests Passing):**
- `@rechersion/shared` (28 tests): Deterministic observation rules, cycle-to-cycle comparison engine, care navigator triage engine, Australian preventive screening state machines, and i18n wording compliance.
- `@rechersion/server` (50 tests): Multi-tenant isolation, Argon2id auth, AES-256-GCM crypto, screening timelines, PDF generation, sync outbox, share tokens, AI guardrails, About Me profile endpoints, Care Navigator endpoints, Care Finder directory routes, and 3-stage debrief/follow-up routes.

---

## 📋 Clinical Review & Production Readiness Roadmap

All clinical decisions, triage rules, screening thresholds, and translated safety disclaimers are documented in `CLINICAL_REVIEW_TODO.md` for independent human clinical sign-off:

- [ ] **RACGP Clinical Protocol Review**: Formal evaluation of the rule criteria in `au.json` with an Australian General Practitioner or RACGP representative.
- [ ] **Therapeutic Goods Administration (TGA) Review**: Submit documentation to verify classification boundaries under the Australian SaMD (Software as a Medical Device) regulatory framework.
- [ ] **Independent Security Audit**: Penetration testing of session management, AES-256-GCM key rotation, and rate limiting.
- [ ] **Accessibility Audit**: Complete WCAG 2.2 AA accessibility audit for screen readers and high-contrast environments.
- [ ] **FHIR / My Health Record Integration**: Standardized export to Fast Healthcare Interoperability Resources (FHIR) format for Australian digital health integration.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details. Fictional persona data (Maya) is entirely synthetic.
