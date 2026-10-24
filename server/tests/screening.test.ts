import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Screening Timeline API Route (Phase 4)', () => {
  let app: FastifyInstance;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `screening-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        password: 'Password123!',
      },
    });
    userCookie = res.headers['set-cookie'] as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/screening/timeline returns state, why, what is missing, source block, and clinician plan', async () => {
    // First, user records a cervical screening with a clinician plan
    await app.inject({
      method: 'POST',
      url: '/api/v1/screening-records',
      headers: { cookie: userCookie },
      payload: {
        screeningType: 'cervical',
        state: 'completed',
        completedDate: '2024-05-10',
        clinicianPlan: 'Clinician suggested regular discussion in 2029',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/screening/timeline',
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const timeline = JSON.parse(res.body).timeline;
    expect(timeline.length).toBeGreaterThanOrEqual(3);

    const cervicalItem = timeline.find((t: any) => t.screeningType === 'cervical');
    expect(cervicalItem).toBeDefined();
    expect(cervicalItem.source.jurisdiction).toBe('Australia');
    expect(cervicalItem.source.status).toBe('sample, not clinically reviewed');
    expect(cervicalItem.clinicianPlan).toBe('Clinician suggested regular discussion in 2029');
    expect(cervicalItem.whyThisAppears).toBeDefined();
  });
});
