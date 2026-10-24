import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, userProfiles, userConsents } from '../src/db/schema.js';

describe('Server Authentication & Account Isolation (Phase 1)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('healthz returns 200 ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/healthz',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('herhealth-backend');
  });

  it('completes registration flow and sets session cookie', async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'securePassword123!',
        displayName: 'Test User',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe(testEmail);
    expect(body.user.displayName).toBe('Test User');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects login with wrong password with generic error message', async () => {
    const testEmail = `test-wrong-${Date.now()}@example.com`;
    // First register
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'correctPassword123!',
      },
    });

    // Attempt login with wrong password
    const badLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'wrongPassword!',
      },
    });

    expect(badLoginRes.statusCode).toBe(401);
    const body = JSON.parse(badLoginRes.body);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Invalid email or password.');
  });

  it('triggers rate limit after excessive login attempts', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'ratelimit@example.com',
          password: 'somePassword',
        },
      });
      lastStatus = res.statusCode;
    }

    expect(lastStatus).toBe(429);
  });

  it('hard-deletes user and all related rows upon DELETE /api/v1/auth/account', async () => {
    const testEmail = `test-delete-${Date.now()}@example.com`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'deleteMePass123!',
        displayName: 'Delete User',
      },
    });

    const cookie = regRes.headers['set-cookie'] as string;
    const userId = JSON.parse(regRes.body).user.id;

    // Verify row exists in DB
    const dbUserBefore = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    expect(dbUserBefore).toBeDefined();

    // Perform hard-delete
    const delRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/account',
      headers: {
        cookie,
      },
    });

    expect(delRes.statusCode).toBe(200);

    // Verify user row is completely removed from DB
    const dbUserAfter = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    expect(dbUserAfter).toBeUndefined();

    // Verify profile is also deleted
    const profileAfter = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    expect(profileAfter).toBeUndefined();

    // Verify consents are also deleted
    const consentAfter = await db.query.userConsents.findFirst({
      where: eq(userConsents.userId, userId),
    });
    expect(consentAfter).toBeUndefined();
  });
});
