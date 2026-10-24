import { eq, and, isNull, inArray } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { symptomEntries, userConsents, auditEvents } from '../db/schema.js';
import { cryptoService } from './crypto.service.js';
import { lintWording } from '@rechersion/shared';
import { assembleConsultationSummary } from './summary.service.js';

export class ConsentRequiredError extends Error {
  constructor(message = 'AI summary features require explicit consent in Privacy Settings') {
    super(message);
    this.name = 'ConsentRequiredError';
  }
}

export interface AiDraftResult {
  draft: string;
  method: 'ai' | 'deterministic_fallback';
  fallbackReason?: string;
  recordsCount: number;
  entryIds: string[];
}

export async function getUserConsents(userId: string): Promise<Record<string, boolean>> {
  const records = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, userId));

  const consents: Record<string, boolean> = {
    ai_summary: false,
    sync_encrypted: true,
    discreet_mode: false,
  };

  for (const r of records) {
    consents[r.consentType] = Boolean(r.granted);
  }

  return consents;
}

export async function setUserConsent(
  userId: string,
  consentType: string,
  granted: boolean
): Promise<void> {
  const existing = await db
    .select()
    .from(userConsents)
    .where(and(eq(userConsents.userId, userId), eq(userConsents.consentType, consentType)))
    .limit(1);

  const now = new Date().toISOString();

  if (existing.length > 0) {
    await db
      .update(userConsents)
      .set({
        granted: granted ? 1 : 0,
        grantedAt: now,
      })
      .where(eq(userConsents.id, existing[0].id));
  } else {
    await db.insert(userConsents).values({
      id: crypto.randomUUID(),
      userId,
      consentType,
      granted: granted ? 1 : 0,
      grantedAt: now,
    });
  }

  // Audit event (zero health text)
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    userId,
    action: granted ? 'consent_granted' : 'consent_revoked',
    entityType: 'consent',
    entityId: consentType,
    timestamp: now,
  });
}

export async function draftAiSummary(
  userId: string,
  input: { entryIds: string[]; promptContext?: string }
): Promise<AiDraftResult> {
  const { entryIds, promptContext } = input;

  // 1. Mandatory Rule: Check explicit consent
  const consents = await getUserConsents(userId);
  if (!consents.ai_summary) {
    throw new ConsentRequiredError();
  }

  // 2. Fetch and decrypt only the selected records
  if (!entryIds || entryIds.length === 0) {
    throw new Error('At least one entryId is required to generate a summary');
  }

  const entries = await db
    .select()
    .from(symptomEntries)
    .where(
      and(
        eq(symptomEntries.userId, userId),
        isNull(symptomEntries.deletedAt),
        inArray(symptomEntries.id, entryIds)
      )
    );

  if (entries.length === 0) {
    throw new Error('No matching active entries found for the provided IDs');
  }

  // Build factual string of records
  const recordDescriptions: string[] = [];
  const knownSymptoms = new Set<string>();
  const knownDates = new Set<string>();

  for (const entry of entries) {
    knownSymptoms.add(entry.symptom.toLowerCase());
    knownDates.add(entry.eventDate);

    let line = `• Date: ${entry.eventDate}, Symptom: "${entry.symptom}"`;
    if (entry.severity !== null && entry.severity !== undefined) {
      line += `, Severity: ${entry.severity}/5`;
    } else {
      line += `, Severity: not recorded`;
    }
    if (entry.sleepQuality !== null && entry.sleepQuality !== undefined) {
      line += `, Sleep quality: ${entry.sleepQuality}/5`;
    }
    if (entry.mood !== null && entry.mood !== undefined) {
      line += `, Mood: ${entry.mood}/5`;
    }
    if (entry.notesEncrypted) {
      try {
        const decryptedNotes = cryptoService.decryptField(entry.notesEncrypted);
        line += `, Self-reported notes: "${decryptedNotes}"`;
      } catch {
        // Skip unreadable note
      }
    }
    recordDescriptions.push(line);
  }

  const recordsBlock = recordDescriptions.join('\n');

  function runFallback() {
    return assembleConsultationSummary(userId, {
      selectedEntryIds: entryIds,
      whatChanged: promptContext || '',
      mainConcerns: '',
      firstNoticed: '',
      dailyImpact: '',
      relevantRecords: '',
      questionsForDoctor: '',
      includeScreenings: true,
      includeAppointments: true,
    });
  }

  // 3. Check for Anthropic API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Graceful fallback to deterministic summary generator
    const deterministic = await runFallback();

    return {
      draft: deterministic.generatedText,
      method: 'deterministic_fallback',
      fallbackReason: 'AI service key not configured; used deterministic summary engine.',
      recordsCount: entries.length,
      entryIds,
    };
  }

  // 4. Call Anthropic Messages API
  try {
    const systemPrompt =
      'You are a medical scribe summarizing self-reported patient symptom entries for an Australian GP consultation. ' +
      'Write only factual, descriptive summaries of the provided records. ' +
      'NEVER diagnose, NEVER predict, NEVER prescribe, and NEVER declare a condition abnormal or normal. ' +
      'Adhere strictly to non-diagnostic objective phrasing. Use sections: "Recorded Patterns", "Chronology", and "Points for Discussion".';

    const userPrompt =
      `Here are ${entries.length} self-reported journal check-ins:\n\n${recordsBlock}\n\n` +
      (promptContext ? `User focus: "${promptContext}"\n\n` : '') +
      'Summarize these entries objectively for a general practitioner appointment.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API responded with status ${response.status}`);
    }

    const json = (await response.json()) as any;
    const aiText = json?.content?.[0]?.text;

    if (!aiText || typeof aiText !== 'string') {
      throw new Error('Invalid response structure from AI model');
    }

    // 5. Post-generation guardrails
    // Guardrail A: Strict wording linter (Rule 3)
    const lintResult = lintWording(aiText);
    if (!lintResult.valid) {
      // AI output violated non-diagnostic policy; fallback to deterministic
      const deterministic = await runFallback();

      return {
        draft: deterministic.generatedText,
        method: 'deterministic_fallback',
        fallbackReason: 'AI draft contained disallowed diagnostic phrasing; replaced with verified deterministic engine.',
        recordsCount: entries.length,
        entryIds,
      };
    }

    // Audit log event (strictly zero health content, only metadata)
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      userId,
      action: 'ai_draft_generated',
      entityType: 'summary',
      entityId: entryIds.join(','),
      timestamp: new Date().toISOString(),
    });

    return {
      draft: aiText,
      method: 'ai',
      recordsCount: entries.length,
      entryIds,
    };
  } catch (error: any) {
    // Fallback on network or service error
    const deterministic = await runFallback();

    return {
      draft: deterministic.generatedText,
      method: 'deterministic_fallback',
      fallbackReason: `AI call failed (${error.message || 'network error'}); used deterministic summary engine.`,
      recordsCount: entries.length,
      entryIds,
    };
  }
}
