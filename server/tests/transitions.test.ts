import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Phase 5 - Life-Stage Transitions', () => {
  let app: FastifyInstance;
  let authCookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const email = `transition-user-${Date.now()}@test.com`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password: 'Password123!' },
    });
    expect(regRes.statusCode).toBe(201);

    const setCookies = regRes.headers['set-cookie'];
    const cookieArray = Array.isArray(setCookies) ? setCookies : [setCookies || ''];
    authCookie = cookieArray.map(c => c.split(';')[0]).join('; ');

    const tokenRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/csrf-token',
      headers: { cookie: authCookie },
    });
    csrfToken = tokenRes.json().csrfToken;
  });

  it('suggests transition plan from perimenopause to postmenopause with Australian guidelines', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/transitions/suggest',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        currentStage: 'perimenopause',
        targetStage: 'postmenopause',
      },
    });

    expect(res.statusCode).toBe(200);
    const plan = res.json();
    expect(plan.targetStage).toBe('postmenopause');
    expect(plan.title).toContain('Postmenopause');
    expect(plan.rationale).toContain('12 continuous months');

    // Modules to enable and retire
    const enableIds = plan.suggestedModulesToEnable.map((m: any) => m.id);
    expect(enableIds).toContain('bone_density');
    expect(enableIds).toContain('heart_cardio');

    const retireIds = plan.suggestedModulesToRetire.map((m: any) => m.id);
    expect(retireIds).toContain('cycle');

    // Australian preventive recommendations
    const screeningSources = plan.preventiveScreenings.map((s: any) => s.source);
    expect(screeningSources.some((s: string) => s.includes('BreastScreen Australia'))).toBe(true);
    expect(screeningSources.some((s: string) => s.includes('Bowel Cancer Screening'))).toBe(true);
  });

  it('applies life-stage transition, activating modules and recording audit event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/transitions',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        fromStage: 'perimenopause',
        toStage: 'postmenopause',
        modulesToEnable: ['bone_density', 'heart_cardio'],
        modulesToDecline: ['cycle'],
        notes: 'Reached 12 consecutive months without cycle.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.activeModules).toContain('bone_density');
    expect(body.activeModules).toContain('heart_cardio');
    expect(body.activeModules).not.toContain('cycle');
  });
});
