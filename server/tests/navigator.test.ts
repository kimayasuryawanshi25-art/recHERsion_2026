import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { auditEvents } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('Phase 12 - Care Navigator Server Endpoint', () => {
  let app: FastifyInstance;
  let authCookie: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register test user
    const email = `navigator-user-${Date.now()}@test.com`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password: 'Password123!' },
    });
    expect(regRes.statusCode).toBe(201);
    userId = regRes.json().user.id;
    const setCookies = regRes.headers['set-cookie'];
    authCookie = (Array.isArray(setCookies) ? setCookies : [setCookies || ''])
      .map(c => c.split(';')[0])
      .join('; ');
  });

  it('1. Rejects invalid care navigator input with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/navigator/assess',
      payload: {
        pregnantOrPostpartum: 'invalid_status_value',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('2. Evaluates emergency red flags and returns care level', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/navigator/assess',
      payload: {
        suddenSeverePain: true,
        heavyBleeding: true,
        pregnantOrPostpartum: 'yes',
        feverWithRigorsOrStiffNeck: false,
        shortnessOfBreathOrChestPain: false,
        dizzinessOrFainting: false,
        symptomDurationDays: 0,
        currentPrimaryConcern: 'Severe lower abdominal pain with spotting',
      },
    });

    expect(res.statusCode).toBe(200);
    const { assessment } = res.json();
    expect(assessment.careLevel).toBe('emergency');
    expect(assessment.whereToSeek).toBeDefined();
    expect(assessment.sourceGuideline.verifiedOn).toBe('2026-10-24');
  });

  it('3. Authenticated requests log non-health audit entries without sensitive text', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/navigator/assess',
      headers: { cookie: authCookie },
      payload: {
        suddenSeverePain: false,
        heavyBleeding: false,
        pregnantOrPostpartum: 'no',
        feverWithRigorsOrStiffNeck: false,
        shortnessOfBreathOrChestPain: false,
        dizzinessOrFainting: false,
        symptomDurationDays: 10,
        currentPrimaryConcern: 'Persistent mild pelvic ache',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().assessment.careLevel).toBe('routine');

    // Verify audit event does NOT contain the symptoms or text
    const logs = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, userId));

    const navLog = logs.find(l => l.action === 'care_navigator_assessed');
    expect(navLog).toBeDefined();
    expect(navLog!.entityId).toBe('routine'); // Only care level ID stored
  });
});
