import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import crypto from 'node:crypto';

describe('Phase 9: AI Draft Summary & Consent Gating', () => {
  let app: FastifyInstance;
  let cookieHeader: string;
  let entryId1: string;
  let entryId2: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register test user
    const email = `ai-user-${crypto.randomUUID()}@example.com`;
    const password = 'AiPassword123!';

    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password },
    });

    cookieHeader = regRes.headers['set-cookie'] as string;

    // Create 2 test symptom entries
    const e1 = await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: cookieHeader },
      payload: {
        eventDate: '2026-10-15',
        symptom: 'Pelvic cramping',
        severity: 3,
        mood: 2,
        sleepQuality: 2,
        notes: 'Dull ache after walking',
      },
    });
    entryId1 = JSON.parse(e1.body).entry.id;

    const e2 = await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: cookieHeader },
      payload: {
        eventDate: '2026-10-18',
        symptom: 'Headache',
        severity: 4,
        notes: 'Throbbing temples',
      },
    });
    entryId2 = JSON.parse(e2.body).entry.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks AI draft summary when user has not granted ai_summary consent (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/draft-summary',
      headers: { cookie: cookieHeader },
      payload: {
        entryIds: [entryId1, entryId2],
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CONSENT_REQUIRED');
    expect(body.message).toContain('explicit consent');
  });

  it('updates consent via PUT /api/v1/ai/consents', async () => {
    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/ai/consents',
      headers: { cookie: cookieHeader },
      payload: {
        consentType: 'ai_summary',
        granted: true,
      },
    });

    expect(putRes.statusCode).toBe(200);
    const body = JSON.parse(putRes.body);
    expect(body.consents.ai_summary).toBe(true);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/ai/consents',
      headers: { cookie: cookieHeader },
    });

    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.body).consents.ai_summary).toBe(true);
  });

  it('gracefully falls back to deterministic summary when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/draft-summary',
      headers: { cookie: cookieHeader },
      payload: {
        entryIds: [entryId1, entryId2],
        promptContext: 'Preparing for annual checkup',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.method).toBe('deterministic_fallback');
    expect(body.draft).toBeDefined();
    expect(body.draft).toContain('Pelvic cramping');
    expect(body.draft).toContain('Headache');
    expect(body.recordsCount).toBe(2);
  });

  it('successfully generates AI summary when Anthropic API responds with non-diagnostic text', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock-test-key';

    const validAiResponse = {
      content: [
        {
          type: 'text',
          text: 'Recorded Patterns:\nBetween 2026-10-15 and 2026-10-18, the records reflect pelvic cramping (severity 3/5) and headache (severity 4/5). Sleep quality was noted at 2/5 on 2026-10-15.\n\nPoints for Discussion:\nReview frequency and potential pain management strategies with your doctor.',
        },
      ],
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validAiResponse,
    } as any);

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/draft-summary',
        headers: { cookie: cookieHeader },
        payload: {
          entryIds: [entryId1, entryId2],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.method).toBe('ai');
      expect(body.draft).toContain('Recorded Patterns');
      expect(body.recordsCount).toBe(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('rejects AI draft and falls back to deterministic engine when AI model outputs banned diagnostic words', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock-test-key';

    // Disallowed content violating Rule 3 (diagnostic wording)
    const violatingAiResponse = {
      content: [
        {
          type: 'text',
          text: 'Based on these symptoms, you have a medical disorder and you may have endometriosis disease. The patient should take pain medications.',
        },
      ],
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => violatingAiResponse,
    } as any);

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/draft-summary',
        headers: { cookie: cookieHeader },
        payload: {
          entryIds: [entryId1, entryId2],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      // The guardrail MUST catch the violation and reject it
      expect(body.method).toBe('deterministic_fallback');
      expect(body.fallbackReason).toContain('contained disallowed diagnostic phrasing');
      expect(body.draft).not.toContain('you have a medical disorder');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
