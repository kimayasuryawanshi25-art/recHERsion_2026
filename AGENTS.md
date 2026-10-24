# HerHealth Companion — Non-Negotiable System Rules

All agents and contributors working on this codebase must strictly adhere to these rules:

1. **Explicit Missing Data Handling:** Unanswered or skipped fields are `null` and shown as "not recorded". Never convert unknown to `0`, `false`, or `"none"` in the UI, charts, rules engine, or PDF outputs.
2. **Transparent Observations:** Every observation or reminder output includes `ruleId`, `ruleVersion`, `supportingEntryIds`, `coverage` (`{ entriesUsed, dateRange }`), and `limitation`. No health score, no risk percentage, and no condition labels.
3. **Objective Descriptive Wording:** Wording is strictly descriptive (e.g., *"You recorded X in N of M check-ins"*). Forbidden phrases include:
   - `"you have"`
   - `"you may have"`
   - `"this means"`
   - `"abnormal"`
   - `"normal"` (used as a clinical verdict)
   - `"you are at risk"`
   - `"you should take"`
   Automated tests scan every template, summary, and PDF text to ensure zero violations.
4. **Verifiable Preventive Rules:** Only items traceable to a cited public guideline with jurisdiction (Australia), source URL, version, and review date may be included. NEVER invent thresholds or intervals. If unsure, output *"history needed / ask your clinician"* with no computed date, and leave a explicit TODO for clinical review. Label all guideline packs as `"sample, not clinically reviewed"`.
5. **Draft Rule Isolation:** Draft rules must not execute in production (`NODE_ENV === 'production'`). Enforced by code guards and automated test suites.
6. **Zero Health Logging:** Never log health content or sensitive personal data. Audit logs store only the action type, entity IDs, timestamps, and non-sensitive metadata.
7. **Strict Input Validation & Scoping:** Every route validates input with Zod, rejects unknown fields (`.strict()`), and is strictly scoped to the authenticated user's ID.
8. **No Tracking:** Zero analytics, third-party trackers, or external telemetry.
9. **Clinical Review Flagging:** Every medical-content or health guidance decision must be flagged for clinical review.
