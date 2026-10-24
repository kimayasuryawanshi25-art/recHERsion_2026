import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { ExportDataSchema } from '@rechersion/shared';

describe('Phase 11 - About Me Profile, Living Sections & Summary Integration', () => {
  let app: FastifyInstance;
  let userACookie: string;
  let userACsrf: string;
  let userBCookie: string;
  let _userBCsrf: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register User A
    const emailA = `profile-a-${Date.now()}@test.com`;
    const regResA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: emailA, password: 'Password123!' },
    });
    expect(regResA.statusCode).toBe(201);
    const setCookiesA = regResA.headers['set-cookie'];
    userACookie = (Array.isArray(setCookiesA) ? setCookiesA : [setCookiesA || ''])
      .map(c => c.split(';')[0])
      .join('; ');

    const tokenResA = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/csrf-token',
      headers: { cookie: userACookie },
    });
    userACsrf = tokenResA.json().csrfToken;

    // Register User B
    const emailB = `profile-b-${Date.now()}@test.com`;
    const regResB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: emailB, password: 'Password123!' },
    });
    expect(regResB.statusCode).toBe(201);
    const setCookiesB = regResB.headers['set-cookie'];
    userBCookie = (Array.isArray(setCookiesB) ? setCookiesB : [setCookiesB || ''])
      .map(c => c.split(';')[0])
      .join('; ');

    const tokenResB = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/csrf-token',
      headers: { cookie: userBCookie },
    });
    _userBCsrf = tokenResB.json().csrfToken;
  });

  it('1. Handles null semantics with "declined" and "unknown" values', async () => {
    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile/about-me/reproductive_context',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        content: {
          menstrualStatus: 'declined',
          fertilityIntent: 'unknown',
          contraceptionCurrent: 'None recorded',
          pregnanciesCount: null,
        },
      },
    });
    expect(putRes.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/profile/about-me',
      headers: { cookie: userACookie },
    });
    expect(getRes.statusCode).toBe(200);
    const data = getRes.json();
    expect(data.sections.reproductive_context.menstrualStatus).toBe('declined');
    expect(data.sections.reproductive_context.fertilityIntent).toBe('unknown');
    expect(data.sections.reproductive_context.pregnanciesCount).toBeNull();
  });

  it('2. Enforces multi-tenant isolation across User A and User B', async () => {
    // User A creates a health item
    const itemRes = await app.inject({
      method: 'POST',
      url: '/api/v1/profile/health-items',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        kind: 'allergy',
        label: 'Penicillin allergy',
        status: 'known',
        includeInSummary: true,
      },
    });
    expect(itemRes.statusCode).toBe(201);
    const itemId = itemRes.json().healthItem.id;

    // User B fetches health items
    const userBItemsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/profile/health-items',
      headers: { cookie: userBCookie },
    });
    expect(userBItemsRes.statusCode).toBe(200);
    const userBItems = userBItemsRes.json().healthItems;
    expect(userBItems.find((i: any) => i.id === itemId)).toBeUndefined();
    expect(userBItems.length).toBe(0);

    // User B cannot see User A's reproductive section
    const userBAboutMeRes = await app.inject({
      method: 'GET',
      url: '/api/v1/profile/about-me',
      headers: { cookie: userBCookie },
    });
    expect(userBAboutMeRes.statusCode).toBe(200);
    expect(userBAboutMeRes.json().sections.reproductive_context).toBeUndefined();
  });

  it('3. Respects include-toggle in summary assembly', async () => {
    // 1 item included, 1 item excluded
    await app.inject({
      method: 'POST',
      url: '/api/v1/profile/health-items',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        kind: 'condition',
        label: 'Asthma (Included)',
        status: 'known',
        includeInSummary: true,
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/profile/health-items',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        kind: 'condition',
        label: 'Private Condition (Excluded)',
        status: 'known',
        includeInSummary: false,
      },
    });

    // 1 medicine event included
    await app.inject({
      method: 'POST',
      url: '/api/v1/profile/medicines',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        name: 'Salbutamol Inhaler',
        dose: '100 mcg',
        frequency: 'As needed',
        includeInSummary: true,
      },
    });

    // 1 life event included
    await app.inject({
      method: 'POST',
      url: '/api/v1/profile/life-events',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        category: 'job_change',
        title: 'Started night shift rotation',
        date: '2026-09-01',
        includeInSummary: true,
      },
    });

    // Assemble consultation summary
    const summaryRes = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        whatChanged: 'More breathless lately',
        mainConcerns: 'Asthma flare-ups',
        firstNoticed: 'Two weeks ago',
        dailyImpact: 'Difficulty walking uphill',
        relevantRecords: 'Peak flow readings',
        questionsForDoctor: 'Should dosage be adjusted?',
      },
    });
    expect(summaryRes.statusCode).toBe(201);
    const summary = summaryRes.json();

    // Verification
    expect(summary.generatedText).toContain('Asthma (Included)');
    expect(summary.generatedText).not.toContain('Private Condition (Excluded)');
    expect(summary.generatedText).toContain('Salbutamol Inhaler');
    expect(summary.generatedText).toContain('Started night shift rotation');
  });

  it('4. Successfully validates exported data conforming to ExportDataSchema', () => {
    const exportData = {
      schemaVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      appName: 'HerHealth Companion',
      symptomEntries: [],
      consultationSummaries: [],
      profileSections: {
        basics: { birthYear: 1990, region: 'NSW, Australia' },
      },
      healthItems: [
        {
          id: 'hi-1',
          kind: 'condition',
          label: 'Endometriosis',
          status: 'known',
          includeInSummary: true,
          updatedAt: new Date().toISOString(),
        },
      ],
      lifeEvents: [
        {
          id: 'le-1',
          category: 'job_change',
          title: 'New job',
          date: '2026-01-01',
          includeInSummary: true,
          updatedAt: new Date().toISOString(),
        },
      ],
      careTeam: [
        {
          id: 'ct-1',
          name: 'Dr. Jane Smith',
          role: 'gp',
          clinic: 'Community Health Centre',
          includeInSummary: true,
          updatedAt: new Date().toISOString(),
        },
      ],
      medicineEvents: [
        {
          id: 'me-1',
          name: 'Iron Supplement',
          dose: '65mg',
          frequency: 'Daily',
          includeInSummary: true,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const parseResult = ExportDataSchema.safeParse(exportData);
    expect(parseResult.success).toBe(true);
  });
});
