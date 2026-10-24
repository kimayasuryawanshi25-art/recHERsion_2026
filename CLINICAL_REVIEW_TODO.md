# Clinical Review Backlog (CLINICAL_REVIEW_TODO.md)

This living register records every piece of medical content, triage guideline, screening prompt, and clinical explanation in HerHealth Companion that must undergo review and sign-off by a qualified human clinical professional (GP, gynaecologist, or public health practitioner) before production deployment.

---

## Phase 11: About Me Profile & Living Sections

| ID | Item / Feature | Proposed Text / Logic | Sourced Authority / Basis | Status | Reviewer Notes |
|---|---|---|---|---|---|
| CR-11-01 | About Me: 10 "Why We Ask" Prompts | User-facing rationales for gathering reproductive status, surgeries, allergies, medicines, family history, lifestyle. | RANZCOG patient communication guidance; RACGP general practice standards | Pending Clinical Review | Ensure explanations are non-stigmatizing and maintain patient comfort. |
| CR-11-02 | Consultation Summary Background Formatting | Presenting self-reported conditions, allergies, and medicines strictly as "RECORDED HEALTH BACKGROUND" without inferring contraindications. | Australian Digital Health Agency (ADHA) Event Summary format | Pending Clinical Review | Clinicians should verify readability in rapid 15-minute consultations. |
| CR-11-03 | Timeline Context Markers | Labeling medicines and life events strictly as "Context marker — recorded by you" without causal claims. | AGENTS.md non-inferential design rule | Pending Clinical Review | Verify that separation between symptoms and context is evident to clinicians reading exported histories. |
| CR-11-04 | Preventive Screening Linking | "History needed to personalize" prompt on breast/cervical screening when family history is unrecorded. | Australian National Cervical Screening Program & BreastScreen Australia | Pending Clinical Review | Ensure users understand this is informational guidance rather than an individual risk calculation. |

---

## Phase 12: Care Navigator (Triage, Red Flags & Clinical Questions)

| ID | Item / Feature | Proposed Text / Logic | Sourced Authority / Basis | Status | Reviewer Notes |
|---|---|---|---|---|---|
| CR-12-01 | Red Flag Criteria & Triage Tiers | Acute chest pain/dyspnoea, bleeding in pregnancy, acute pelvic pain in pregnancy, and presyncope with bleeding triaged as Emergency; isolated heavy bleeding (>2 pads/hr) or high fever with rigors as Urgent (12–24h). | WHO ETAT Emergency Triage Guidelines; Healthdirect Australia Clinical Symptom Checker | Pending Clinical Review | Review thresholds for obstetric/gynaecologic emergency vs urgent walk-in. |
| CR-12-02 | What to Ask Your Clinician Prompts | Generated checklists for emergency (imaging/admission), urgent (blood tests, pain relief), routine (symptom diary), and self-care visits. | RACGP General Practice Consultation Guidelines | Pending Clinical Review | Verify prompt relevance across varied clinical backgrounds. |
| CR-12-03 | Mandatory Safe Default Language | Strict ban on false reassurance ("nothing to worry about"); mandatory default: "If you are worried, speak to a health professional." | AGENTS.md Safe Wording & Linter Rule | Pending Clinical Review | Confirmed compliant with non-diagnostic and non-reassurance criteria. |

---

## Phase 13: Care Finder & Crisis Helplines

| ID | Item / Feature | Proposed Text / Logic | Sourced Authority / Basis | Status | Reviewer Notes |
|---|---|---|---|---|---|
| CR-13-01 | Helpline Categorization & Scope | Grouping helplines into 24/7 emergency, domestic violence (1800RESPECT), perinatal (PANDA), First Nations (13YARN), LGBTQIA+ (QLife), and crisis support (Lifeline/Beyond Blue). | Australian Department of Health & Aged Care National Helplines Register | Pending Clinical Review | Review helpline operating hours and triage boundaries. |
| CR-13-02 | Trusted Contact Pre-Drafted Message | "Hi [Name], I am using my health organizer app and wanted to let you know I may need some support right now. Could you check in on me?" with double confirmation. | Trauma-informed safety protocol; AGENTS.md rule | Pending Clinical Review | Verify that wording avoids generating panic while effectively requesting social support. |
| CR-13-03 | Care Directory Verified Badge Rules | Requiring explicit `sourceUrl` and `verifiedOn` timestamp on every listed health clinic, bulk-billing clinic, and hospital ED. | AGENTS.md Directory Verifiability Rule | Pending Clinical Review | Verify that annual re-verification policy is sufficient for clinical referral accuracy. |## Phase 14: 3-Stage Appointment Loop, Debrief & Medication Tracking

| ID | Item / Feature | Proposed Text / Logic | Sourced Authority / Basis | Status | Reviewer Notes |
|---|---|---|---|---|---|
| CR-14-01 | In-Consultation Priority Checklist | Real-time question checklist and notepad for patients during active appointments to ensure key concerns are discussed. | RACGP Patient Self-Advocacy & Active Consultation Guidelines | Pending Clinical Review | Verify that question prompts support constructive doctor-patient dialogue within 15-minute consultations. |
| CR-14-02 | Post-Visit Debrief Schema | Structured recording of doctor explanations, ordered investigations, prescription changes, and recommended return timeframe. | Australian Digital Health Agency (ADHA) Consultation Records Guidance | Pending Clinical Review | Ensure fields capture patient recollections without implying clinical verification of advice. |
| CR-14-03 | Medication Refill Alerts | Low refill thresholds (<= 2 refills remaining) and calendar reminder prompts; strictly avoiding adherence scoring or dosing recommendations. | Australian Commission on Safety and Quality in Health Care (ACSQHC) Medication Safety | Pending Clinical Review | Verify that refill reminders do not encourage self-directed dosage modifications. |
| CR-14-04 | Follow-Up Action Item Tracking | Tracking tests to book, prescriptions to collect, and return visits with status checkboxes and due dates. | NPS MedicineWise & Healthdirect Follow-Up Action Planning | Pending Clinical Review | Confirm that task tracking assists patient self-organization without replacing official discharge summaries. |

---

## Phase 15: Clinician View, Simulated Consult & Records Vault

| ID | Item / Feature | Proposed Text / Logic | Sourced Authority / Basis | Status | Reviewer Notes |
|---|---|---|---|---|---|
| CR-15-01 | 4-Quadrant Rapid Clinical Scan | Four structured quadrants (Primary Concerns & Timing, Daily Functional Impact, Recorded Health Background, Priority Questions) for rapid 10-15 minute GP consults. | RACGP General Practice Standards; Australian Digital Health Agency (ADHA) Event Summaries | Pending Clinical Review | Verify that the 4-quadrant layout delivers critical clinical context within 30 seconds of GP review. |
| CR-15-02 | Simulated Teleconsult Rehearsal Scripts | Interactive dialogue prompts and patient advocacy tips (e.g., stating primary impact in first 60 seconds) with explicit "DEMO ONLY" banner. | Healthdirect Australia Telehealth Guidelines; RACGP Telehealth Standards | Pending Clinical Review | Review simulated dialogue to ensure advice empowers patient communication without predetermining diagnoses. |
| CR-15-03 | Records Vault Categories & Scopes | Document categories (Pathology / Blood Test, Ultrasound / Imaging, Specialist Letter, Prescription, Other) stored privately in local IndexedDB. | Australian Privacy Principles (APPs); ADHA My Health Record document categorization | Pending Clinical Review | Confirm that document categories match standard clinical classifications in Australian primary care. |
