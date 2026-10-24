import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { shareTokens } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('Phase 7 - Secure Share Links', () => {
  let app: FastifyInstance;
  let authCookie: string;
  let csrfToken: string;
  let summaryId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const email = `share-user-${Date.now()}@test.com`;
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

    // Create a consultation summary to share
    const sumRes = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        whatChanged: 'Joint ache and low afternoon energy',
        mainConcerns: 'Knee stiffness during morning walks',
        firstNoticed: 'Two weeks ago',
        dailyImpact: 'Taking stairs more slowly',
        relevantRecords: 'Stretching routine',
        questionsForDoctor: 'Should I see a physiotherapist?',
      },
    });
    summaryId = sumRes.json().id;
  });

  it('generates a 32-byte cryptographically random token, stored as SHA-256 hash in DB', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/share',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        summaryId,
        expiryDays: 7,
        maxViews: 2,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.rawToken).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(body.maxViews).toBe(2);

    // Verify token is hashed in DB, NOT stored raw
    const [row] = await db.select().from(shareTokens).where(eq(shareTokens.id, body.id));
    expect(row).toBeDefined();
    expect(row.tokenHash).not.toBe(body.rawToken);

    const expectedHash = crypto.createHash('sha256').update(body.rawToken).digest('hex');
    expect(row.tokenHash).toBe(expectedHash);
  });

  it('provides public read-only access with anti-indexing headers and enforces view limits', async () => {
    // Create link with max 2 views
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/share',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        summaryId,
        expiryDays: 3,
        maxViews: 2,
      },
    });
    const { rawToken } = createRes.json();

    // 1st Public View (NO auth cookie needed)
    const view1 = await app.inject({
      method: 'GET',
      url: `/api/v1/share/public/${rawToken}`,
    });
    expect(view1.statusCode).toBe(200);
    expect(view1.headers['x-robots-tag']).toBe('noindex, nofollow, noarchive');
    expect(view1.json().summary.whatChanged).toContain('Joint ache');
    expect(view1.json().shareInfo.viewsRemaining).toBe(1);

    // 2nd Public View
    const view2 = await app.inject({
      method: 'GET',
      url: `/api/v1/share/public/${rawToken}`,
    });
    expect(view2.statusCode).toBe(200);
    expect(view2.json().shareInfo.viewsRemaining).toBe(0);

    // 3rd Public View (exceeds maxViews = 2)
    const view3 = await app.inject({
      method: 'GET',
      url: `/api/v1/share/public/${rawToken}`,
    });
    expect(view3.statusCode).toBe(410);
    expect(view3.json().message).toContain('maximum view limit');
  });

  it('revokes share link and blocks subsequent public access', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/share',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        summaryId,
        expiryDays: 5,
        maxViews: 5,
      },
    });
    const { id: shareId, rawToken } = createRes.json();

    // Revoke
    const revokeRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/share/${shareId}`,
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
    });
    expect(revokeRes.statusCode).toBe(200);

    // Public view after revocation
    const publicRes = await app.inject({
      method: 'GET',
      url: `/api/v1/share/public/${rawToken}`,
    });
    expect(publicRes.statusCode).toBe(410);
    expect(publicRes.json().message).toContain('revoked');
  });
});
