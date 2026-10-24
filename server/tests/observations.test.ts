import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { lintWording } from '@rechersion/shared';

describe('Observations Service & Evidence Delivery (Phase 3)', () => {
  let app: FastifyInstance;
  let userCookie: string;
  let entryIds: string[] = [];

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register user
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `obs-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        password: 'Password123!',
      },
    });
    userCookie = res.headers['set-cookie'] as string;

    // Seed 4 sample entries for this user
    const entriesData = [
      { eventDate: '2026-09-01', symptom: 'Hot flash', severity: 4, mood: 2, sleepQuality: 1, dailyImpact: 'Interrupted sleep' },
      { eventDate: '2026-09-01', symptom: 'Night sweats', severity: 4, mood: 2, sleepQuality: 1 },
      { eventDate: '2026-09-05', symptom: 'Hot flash', severity: 3, mood: 3, sleepQuality: 2 },
      { eventDate: '2026-09-10', symptom: 'Hot flash', severity: 4, mood: 2, sleepQuality: 2, dailyImpact: 'Felt tired at work' },
    ];

    for (const data of entriesData) {
      const eRes = await app.inject({
        method: 'POST',
        url: '/api/v1/symptom-entries',
        headers: { cookie: userCookie },
        payload: data,
      });
      entryIds.push(JSON.parse(eRes.body).entry.id);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/rules returns seeded rules from registry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/rules',
    });

    expect(res.statusCode).toBe(200);
    const rules = JSON.parse(res.body).rules;
    expect(rules.length).toBeGreaterThanOrEqual(6);
    expect(rules.some((r: any) => r.ruleId === 'symptom-frequency')).toBe(true);
    expect(rules.some((r: any) => r.ruleId === 'severity-summary')).toBe(true);
  });

  it('GET /api/v1/observations computes observations dynamically with coverage and limitations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/observations',
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const observations = JSON.parse(res.body).observations;
    expect(observations.length).toBeGreaterThan(0);

    for (const obs of observations) {
      expect(obs.ruleId).toBeDefined();
      expect(obs.ruleVersion).toBeDefined();
      expect(obs.title).toBeDefined();
      expect(obs.description).toBeDefined();
      expect(obs.supportingEntryIds).toBeInstanceOf(Array);
      expect(obs.coverage).toBeDefined();
      expect(obs.coverage.entriesUsed).toBeGreaterThan(0);
      expect(obs.coverage.dateRange).toBeDefined();
      expect(obs.limitation).toBeDefined();

      // Automated Wording Lint Check
      const titleLint = lintWording(obs.title);
      expect(titleLint.valid, `Title violation in ${obs.ruleId}: ${JSON.stringify(titleLint.violations)}`).toBe(true);

      const descLint = lintWording(obs.description);
      expect(descLint.valid, `Description violation in ${obs.ruleId}: ${JSON.stringify(descLint.violations)}`).toBe(true);

      const limLint = lintWording(obs.limitation);
      expect(limLint.valid, `Limitation violation in ${obs.ruleId}: ${JSON.stringify(limLint.violations)}`).toBe(true);
    }
  });

  it('GET /api/v1/observations/:id/evidence returns exact supporting entries', async () => {
    const obsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/observations',
      headers: { cookie: userCookie },
    });

    const observations = JSON.parse(obsRes.body).observations;
    const freqObs = observations.find((o: any) => o.ruleId === 'symptom-frequency');
    expect(freqObs).toBeDefined();

    const evRes = await app.inject({
      method: 'GET',
      url: `/api/v1/observations/${freqObs.id}/evidence`,
      headers: { cookie: userCookie },
    });

    expect(evRes.statusCode).toBe(200);
    const evidence = JSON.parse(evRes.body).evidence;
    expect(evidence.length).toBeGreaterThanOrEqual(1);
    expect(freqObs.supportingEntryIds).toContain(evidence[0].id);
  });

  it('soft-deleting an entry recomputes and updates dependent observations', async () => {
    // Check severity observation before deletion
    const obsBeforeRes = await app.inject({
      method: 'GET',
      url: '/api/v1/observations',
      headers: { cookie: userCookie },
    });
    const sevBefore = JSON.parse(obsBeforeRes.body).observations.find((o: any) => o.ruleId === 'severity-summary');
    expect(sevBefore).toBeDefined();

    // Delete 2 entries with severity to drop below minEntries of 3
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/symptom-entries/${entryIds[0]}`,
      headers: { cookie: userCookie },
    });
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/symptom-entries/${entryIds[1]}`,
      headers: { cookie: userCookie },
    });

    // Recheck observations
    const obsAfterRes = await app.inject({
      method: 'GET',
      url: '/api/v1/observations',
      headers: { cookie: userCookie },
    });
    const sevAfter = JSON.parse(obsAfterRes.body).observations.find((o: any) => o.ruleId === 'severity-summary');

    // Severity summary must now be suppressed by coverage guard (only 2 active entries remain with severity)
    expect(sevAfter).toBeUndefined();
  });
});
