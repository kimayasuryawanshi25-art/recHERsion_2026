import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { symptomEntries } from '../src/db/schema.js';

describe('Core Data Routes & Ownership Isolation (Phase 2)', () => {
  let app: FastifyInstance;
  let userACookie: string;
  let userBCookie: string;
  let _userAId: string;
  let _userBId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register User A
    const resA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `user-a-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, password: 'password123!' },
    });
    if (resA.statusCode !== 201) {
      throw new Error(`User A registration failed: ${resA.statusCode} ${resA.body}`);
    }
    userACookie = resA.headers['set-cookie'] as string;
    _userAId = JSON.parse(resA.body).user.id;

    // Register User B
    const resB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `user-b-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, password: 'password123!' },
    });
    if (resB.statusCode !== 201) {
      throw new Error(`User B registration failed: ${resB.statusCode} ${resB.body}`);
    }
    userBCookie = resB.headers['set-cookie'] as string;
    _userBId = JSON.parse(resB.body).user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unknown fields on profile update', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { cookie: userACookie },
      payload: {
        displayName: 'Updated Name',
        unknownHackerField: 'should-fail',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('preserves null values on round-trip without converting to 0 or empty string', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: userACookie },
      payload: {
        eventDate: '2026-10-15',
        symptom: 'Headache',
        severity: null,
        mood: null,
        energy: null,
        sleepQuality: null,
        dailyImpact: null,
        notes: null,
      },
    });

    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body).entry;
    expect(created.severity).toBeNull();
    expect(created.mood).toBeNull();
    expect(created.energy).toBeNull();
    expect(created.sleepQuality).toBeNull();
    expect(created.dailyImpact).toBeNull();
    expect(created.notes).toBeNull();

    // Fetch back
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/symptom-entries/${created.id}`,
      headers: { cookie: userACookie },
    });
    expect(getRes.statusCode).toBe(200);
    const fetched = JSON.parse(getRes.body).entry;
    expect(fetched.severity).toBeNull();
    expect(fetched.mood).toBeNull();
  });

  it('stores sensitive columns as ciphertext in the database file', async () => {
    const sensitiveNote = 'Very confidential personal medical notes for doctor review';
    const sensitiveImpact = 'Disrupted morning presentation completely';

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: userACookie },
      payload: {
        eventDate: '2026-10-18',
        symptom: 'Hot flash',
        severity: 4,
        notes: sensitiveNote,
        dailyImpact: sensitiveImpact,
      },
    });

    expect(createRes.statusCode).toBe(201);
    const entryId = JSON.parse(createRes.body).entry.id;

    // Direct database inspection bypassing HTTP decryption layer
    const dbRow = await db.query.symptomEntries.findFirst({
      where: eq(symptomEntries.id, entryId),
    });

    expect(dbRow).toBeDefined();
    // Raw database columns must be encrypted ciphertext
    expect(dbRow!.notesEncrypted).not.toBe(sensitiveNote);
    expect(dbRow!.notesEncrypted?.startsWith('enc:v1:')).toBe(true);
    expect(dbRow!.dailyImpactEncrypted).not.toBe(sensitiveImpact);
    expect(dbRow!.dailyImpactEncrypted?.startsWith('enc:v1:')).toBe(true);
  });

  it('enforces ownership isolation: User B cannot read, modify, or delete User A entries', async () => {
    // User A creates an entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: userACookie },
      payload: {
        eventDate: '2026-10-20',
        symptom: 'Joint pain',
        severity: 3,
        notes: 'User A private note',
      },
    });
    const entryAId = JSON.parse(createRes.body).entry.id;

    // User B tries to read User A's entry
    const readAttempt = await app.inject({
      method: 'GET',
      url: `/api/v1/symptom-entries/${entryAId}`,
      headers: { cookie: userBCookie },
    });
    expect(readAttempt.statusCode).toBe(404);

    // User B tries to update User A's entry
    const updateAttempt = await app.inject({
      method: 'PUT',
      url: `/api/v1/symptom-entries/${entryAId}`,
      headers: { cookie: userBCookie },
      payload: { symptom: 'Hacked by User B' },
    });
    expect(updateAttempt.statusCode).toBe(404);

    // User B tries to delete User A's entry
    const deleteAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/v1/symptom-entries/${entryAId}`,
      headers: { cookie: userBCookie },
    });
    expect(deleteAttempt.statusCode).toBe(404);

    // Verify User A's entry was unmodified
    const verifyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/symptom-entries/${entryAId}`,
      headers: { cookie: userACookie },
    });
    expect(verifyRes.statusCode).toBe(200);
    expect(JSON.parse(verifyRes.body).entry.symptom).toBe('Joint pain');
  });

  it('modules: returns catalog and suggest endpoint provides rationale without auto-enabling', async () => {
    const catalogRes = await app.inject({
      method: 'GET',
      url: '/api/v1/modules',
      headers: { cookie: userACookie },
    });
    expect(catalogRes.statusCode).toBe(200);
    const catalog = JSON.parse(catalogRes.body).modules;
    expect(catalog.length).toBeGreaterThanOrEqual(6);

    const suggestRes = await app.inject({
      method: 'POST',
      url: '/api/v1/modules/suggest',
      headers: { cookie: userACookie },
      payload: {
        contexts: ['midlife-changes'],
        recentSymptoms: ['Hot flash'],
      },
    });

    expect(suggestRes.statusCode).toBe(200);
    const suggestions = JSON.parse(suggestRes.body).suggestions;
    expect(suggestions.some((s: any) => s.moduleId === 'changing-symptoms')).toBe(true);
    expect(suggestions[0].rationale).toBeDefined();

    // Check catalog again — module should NOT have been activated automatically
    const recheckRes = await app.inject({
      method: 'GET',
      url: '/api/v1/modules',
      headers: { cookie: userACookie },
    });
    const updatedCatalog = JSON.parse(recheckRes.body).modules;
    const changingMod = updatedCatalog.find((m: any) => m.id === 'changing-symptoms');
    expect(changingMod?.status).toBe('suggested');
  });
});
