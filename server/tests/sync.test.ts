import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Phase 6 - Sync Engine API', () => {
  let app: FastifyInstance;
  let authCookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const email = `sync-user-${Date.now()}@test.com`;
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

  it('pushes outbox entries and resolves last-write-wins by clientUpdatedAt', async () => {
    const entryId = `sync-entry-${Date.now()}`;
    const pushRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/push',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        outbox: [
          {
            id: 'outbox-1',
            type: 'symptom_entry',
            action: 'upsert',
            recordId: entryId,
            clientUpdatedAt: '2026-10-24T10:00:00.000Z',
            data: {
              eventDate: '2026-10-24',
              symptom: 'Headache',
              severity: 3,
              notes: 'Sync test note',
            },
          },
        ],
      },
    });

    expect(pushRes.statusCode).toBe(200);
    const body = pushRes.json();
    expect(body.syncedCount).toBe(1);
    expect(body.conflictsResolved).toBe(0);

    // Pull to verify
    const pullRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sync/pull',
      headers: { cookie: authCookie },
    });
    expect(pullRes.statusCode).toBe(200);
    const pullBody = pullRes.json();
    const found = pullBody.entries.find((e: any) => e.id === entryId);
    expect(found).toBeDefined();
    expect(found.symptom).toBe('Headache');
    expect(found.notes).toBe('Sync test note');
  });

  it('drops older client updates if server already has a newer clientUpdatedAt (LWW)', async () => {
    const entryId = `sync-conflict-${Date.now()}`;
    // 1. Push newer version first
    await app.inject({
      method: 'POST',
      url: '/api/v1/sync/push',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        outbox: [
          {
            id: 'outbox-newer',
            type: 'symptom_entry',
            action: 'upsert',
            recordId: entryId,
            clientUpdatedAt: '2026-10-24T12:00:00.000Z',
            data: {
              eventDate: '2026-10-24',
              symptom: 'Cramp',
              severity: 4,
            },
          },
        ],
      },
    });

    // 2. Attempt to push older update
    const stalePush = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/push',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        outbox: [
          {
            id: 'outbox-older',
            type: 'symptom_entry',
            action: 'upsert',
            recordId: entryId,
            clientUpdatedAt: '2026-10-24T08:00:00.000Z',
            data: {
              eventDate: '2026-10-24',
              symptom: 'Stale symptom name',
              severity: 1,
            },
          },
        ],
      },
    });

    expect(stalePush.statusCode).toBe(200);
    expect(stalePush.json().conflictsResolved).toBe(1);
    expect(stalePush.json().syncedCount).toBe(0);

    // Verify newer version remains untouched
    const pullRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sync/pull',
      headers: { cookie: authCookie },
    });
    const found = pullRes.json().entries.find((e: any) => e.id === entryId);
    expect(found.symptom).toBe('Cramp');
    expect(found.severity).toBe(4);
  });
});
