import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Phase 14 - Appointment Debriefs & Follow-Up Tasks Endpoints', () => {
  let app: FastifyInstance;
  let userACookie: string;
  let userACsrf: string;
  let userBCookie: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register User A
    const emailA = `debrief-a-${Date.now()}@test.com`;
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
    const emailB = `debrief-b-${Date.now()}@test.com`;
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
  });

  it('1. Rejects invalid debrief input with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/debriefs',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        visitDate: 'not-a-date',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('2. Creates debrief with embedded follow-up tasks and fetches them', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/debriefs',
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: {
        doctorName: 'Dr. Sarah Connor',
        clinic: 'Sydney Women’s Health Clinic',
        visitDate: '2026-10-24',
        discussedTopics: 'Pelvic cramping patterns and iron levels',
        testsOrdered: 'Pelvic ultrasound and serum ferritin',
        prescriptionsChanged: 'Started oral iron supplement 65mg daily',
        followupDate: '2026-11-24',
        tasks: [
          { title: 'Schedule pelvic ultrasound', category: 'test', dueDate: '2026-11-05' },
          { title: 'Pick up iron supplement prescription', category: 'prescription_pickup', dueDate: '2026-10-25' },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const debriefId = createRes.json().debrief.id;

    // Fetch debriefs
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/debriefs',
      headers: { cookie: userACookie },
    });
    expect(getRes.statusCode).toBe(200);
    const { debriefs } = getRes.json();
    const found = debriefs.find((d: any) => d.id === debriefId);
    expect(found).toBeDefined();
    expect(found.doctorName).toBe('Dr. Sarah Connor');
    expect(found.discussedTopics).toBe('Pelvic cramping patterns and iron levels');

    // Fetch tasks
    const tasksRes = await app.inject({
      method: 'GET',
      url: '/api/v1/debriefs/tasks',
      headers: { cookie: userACookie },
    });
    expect(tasksRes.statusCode).toBe(200);
    const { tasks } = tasksRes.json();
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    const ultrasoundTask = tasks.find((t: any) => t.title === 'Schedule pelvic ultrasound');
    expect(ultrasoundTask).toBeDefined();
    expect(ultrasoundTask.completed).toBe(false);

    // Patch task completion status
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/debriefs/tasks/${ultrasoundTask.id}`,
      headers: { cookie: userACookie, 'x-csrf-token': userACsrf },
      payload: { completed: true },
    });
    expect(patchRes.statusCode).toBe(200);

    // Verify status updated
    const updatedTasksRes = await app.inject({
      method: 'GET',
      url: '/api/v1/debriefs/tasks?completed=true',
      headers: { cookie: userACookie },
    });
    expect(updatedTasksRes.statusCode).toBe(200);
    const completedTasks = updatedTasksRes.json().tasks;
    expect(completedTasks.some((t: any) => t.id === ultrasoundTask.id)).toBe(true);
  });

  it('3. Enforces multi-tenant isolation across User A and User B', async () => {
    const userBTasksRes = await app.inject({
      method: 'GET',
      url: '/api/v1/debriefs/tasks',
      headers: { cookie: userBCookie },
    });
    expect(userBTasksRes.statusCode).toBe(200);
    expect(userBTasksRes.json().tasks.length).toBe(0);

    const userBDebriefsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/debriefs',
      headers: { cookie: userBCookie },
    });
    expect(userBDebriefsRes.statusCode).toBe(200);
    expect(userBDebriefsRes.json().debriefs.length).toBe(0);
  });
});
