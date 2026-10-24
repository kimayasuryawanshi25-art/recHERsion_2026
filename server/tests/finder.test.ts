import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Phase 13 - Care Finder & Verified Directory Server Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  it('1. Returns all verified helplines with required sourceUrl and verifiedOn', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/helplines',
    });
    expect(res.statusCode).toBe(200);
    const { helplines } = res.json();
    expect(helplines.length).toBeGreaterThanOrEqual(5);

    for (const h of helplines) {
      expect(h.name).toBeDefined();
      expect(h.phone).toBeDefined();
      expect(h.sourceUrl).toMatch(/^https?:\/\//);
      expect(h.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('2. Filters helplines by category', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/helplines?category=domestic_family_violence',
    });
    expect(res.statusCode).toBe(200);
    const { helplines } = res.json();
    expect(helplines.length).toBeGreaterThanOrEqual(1);
    expect(helplines.every((h: any) => h.category === 'domestic_family_violence')).toBe(true);
  });

  it('3. Returns verified care providers with required verifiability fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/providers',
    });
    expect(res.statusCode).toBe(200);
    const { providers } = res.json();
    expect(providers.length).toBeGreaterThanOrEqual(4);

    for (const p of providers) {
      expect(p.name).toBeDefined();
      expect(p.address).toBeDefined();
      expect(p.phone).toBeDefined();
      expect(p.sourceUrl).toMatch(/^https?:\/\//);
      expect(p.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('4. Filters providers by type, costModel, and genderAffirming status', async () => {
    const edRes = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/providers?type=hospital_ed',
    });
    expect(edRes.statusCode).toBe(200);
    expect(edRes.json().providers.every((p: any) => p.type === 'hospital_ed')).toBe(true);

    const bbRes = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/providers?costModel=bulk_billing',
    });
    expect(bbRes.statusCode).toBe(200);
    expect(bbRes.json().providers.every((p: any) => p.costModel === 'bulk_billing')).toBe(true);

    const gaRes = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/providers?genderAffirming=true',
    });
    expect(gaRes.statusCode).toBe(200);
    expect(gaRes.json().providers.every((p: any) => p.genderAffirming === true)).toBe(true);
  });

  it('5. Rejects invalid provider filter parameters with 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/finder/providers?type=non_existent_type',
    });
    expect(res.statusCode).toBe(400);
  });
});
