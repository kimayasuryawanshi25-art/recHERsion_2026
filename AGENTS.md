# HerHealth Companion — Non-Negotiable System Rules

All agents and contributors working on this codebase must strictly adhere to these rules:

1. **Explicit Missing Data Handling:** Unanswered or skipped fields are `null` and shown as "not recorded". Never convert unknown to `0`, `false`, or `"none"` in the UI, charts, rules engine, or PDF outputs.
2. **Transparent Observations:** Every observation or reminder output includes `ruleId`, `ruleVersion`, `supportingEntryIds`, `coverage` (`{ entriesUsed, dateRange }`), and `limitation`. No health score, no risk percentage, and no condition labels.
3. **Objective Descriptive Wording & Non-Diagnostic Care Guidance:** Wording is strictly descriptive (e.g., *"You recorded X in N of M check-ins"*). The app may guide users to care (where, how soon, who, what to ask) but must never diagnose, name probable conditions, rank causes, estimate risk, recommend or change medicines, check drug interactions, or reassure (*"nothing to worry about"*). Default wording: *"If you are worried, speak to a health professional."* Forbidden phrases include:
   - `"you have"`
   - `"you may have"`
   - `"this means"`
   - `"abnormal"`
   - `"normal"` (used as a clinical verdict)
   - `"you are at risk"`
   - `"you should take"`
   - `"nothing to worry about"`
   Automated tests scan every template, summary, and PDF text to ensure zero violations.
4. **No BMI, Health Score, or Risk Calculations:** Never calculate or present BMI, health risk scores, composite wellness ratings, or probability estimations anywhere in the application.
5. **Profile Data as Non-Inferential Context Only:** Profile data (conditions, family history, medicines, reproductive context) must never be used by rules or algorithms to infer conditions, predict risks, or generate unsolicited clinical diagnoses. It serves solely as user-controlled context for appointment prep and personalized preventive eligibility filters.
6. **Verifiable Preventive & Triage Guidelines:** Only items traceable to a cited public guideline with jurisdiction, source URL, version, and review date may be included. Any triage or red-flag content must be copied from official public guidance with source, jurisdiction, version, and review date, and be labeled `"sample, not clinically reviewed"` until a clinician signs off. NEVER invent thresholds or intervals. If unsure, output *"history needed / ask your clinician"* with no computed date, and leave an explicit TODO for clinical review.
7. **Directory & Helpline Verifiability:** Every directory, care provider, and helpline listing requires `sourceUrl` and `verifiedOn`. Never display an unverified item as verified. Placeholder data must be explicitly marked as demo data. Single jurisdiction and city must be confirmed with the user before seeding directory data.
8. **Draft Rule Isolation:** Draft rules must not execute in production (`NODE_ENV === 'production'`). Enforced by code guards and automated test suites.
9. **Zero Health Logging:** Never log health content or sensitive personal data. Audit logs store only the action type, entity IDs, timestamps, and non-sensitive metadata.
10. **Strict Input Validation & Scoping:** Every route validates input with Zod, rejects unknown fields (`.strict()`), and is strictly scoped to the authenticated user's ID.
11. **Simulated Features Transparency:** Any simulated demonstration features (such as partner teleconsultation or clinic booking) must display a persistent, visible demonstration banner (*"Demonstration only; no real clinician connection"*).
12. **No Tracking:** Zero analytics, third-party trackers, or external telemetry.
13. **Clinical Review Flagging:** Every medical-content, red-flag item, or health guidance decision must be cataloged in `CLINICAL_REVIEW_TODO.md` for human clinical sign-off.
