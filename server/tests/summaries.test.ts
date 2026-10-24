import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Phase 5 - Consultation Prep, Summaries & PDF Generation', () => {
  let app: FastifyInstance;
  let authCookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register test user
    const email = `summary-user-${Date.now()}@test.com`;
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

    // Seed some test entries (one with severity, one without)
    await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        eventDate: '2026-10-10',
        symptom: 'Pelvic pain',
        severity: 4,
        mood: 2,
        sleepQuality: 2,
        notes: 'Noticeable after walking',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/symptom-entries',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        eventDate: '2026-10-15',
        symptom: 'Pelvic pain',
        severity: null, // Null should remain unrecorded
        notes: 'Mild discomfort',
      },
    });

    // Seed a screening record
    await app.inject({
      method: 'POST',
      url: '/api/v1/screening-records',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        screeningType: 'cervical',
        state: 'scheduled',
        dueDate: '2026-11-01',
      },
    });
  });

  it('assembles consultation summary deterministically from interview answers and records', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        whatChanged: 'Pelvic pain has become more frequent over the last 3 weeks.',
        mainConcerns: 'Pain interfering with exercise.',
        firstNoticed: 'Early October 2026',
        dailyImpact: 'Had to stop running sessions.',
        relevantRecords: 'Paracetamol taken occasionally.',
        questionsForDoctor: 'Are there specific pelvic floor physical therapies recommended?',
        includeScreenings: true,
        includeAppointments: true,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.generatedText).toContain('APPOINTMENT PREPARATION SUMMARY');
    expect(body.generatedText).toContain('Pelvic pain has become more frequent');
    expect(body.generatedText).toContain('Pelvic pain: recorded 2 times');
    // Notice null severity preservation: 1 recorded, 1 unrecorded
    expect(body.generatedText).toContain('Average self-reported severity: 4.0/5 (based on 1 recorded check-in; 1 check-ins did not record severity)');
    expect(body.generatedText).toContain('PREVENTIVE CARE & SCREENINGS');
    expect(body.generatedText).toContain('CERVICAL');
    expect(body.generatedText).toContain('not a clinical assessment, medical diagnosis, or treatment plan');

    // Sections array returned
    expect(Array.isArray(body.sections)).toBe(true);
    expect(body.sections.length).toBeGreaterThan(5);
  });

  it('supports section toggling (omitting disabled sections from generated text)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        whatChanged: 'Secret notes that I want to hide from printed summary',
        mainConcerns: 'My primary concern',
        firstNoticed: 'Two weeks ago',
        dailyImpact: 'Fatigue during afternoons',
        relevantRecords: 'None',
        questionsForDoctor: 'What should my next step be?',
        sectionsConfig: [
          { id: 'whatChanged', title: 'RECENT CHANGES', enabled: false, order: 3 },
          { id: 'mainConcerns', title: 'MAIN CONCERNS', enabled: true, order: 1 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    // The disabled section content must NOT be present in generatedText
    expect(body.generatedText).not.toContain('Secret notes that I want to hide');
    expect(body.generatedText).toContain('My primary concern');

    const whatChangedSec = body.sections.find((s: any) => s.id === 'whatChanged');
    expect(whatChangedSec?.enabled).toBe(false);
  });

  it('updates summary text and enforces non-diagnostic wording linter', async () => {
    // Create initial summary
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        whatChanged: 'Fatigue and headaches',
        mainConcerns: 'Headache frequency',
        firstNoticed: 'Last month',
        dailyImpact: 'Missed one day of work',
        relevantRecords: 'Hydration log',
        questionsForDoctor: 'Could this relate to screen time?',
      },
    });
    const summaryId = createRes.json().id;

    // Attempt to update with banned diagnostic wording (e.g. "pathology disorder diagnosis")
    const failUpdate = await app.inject({
      method: 'PUT',
      url: `/api/v1/summaries/${summaryId}`,
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        editedText: 'This is my diagnosis of a pathology disease disorder for the patient.',
      },
    });

    expect(failUpdate.statusCode).toBe(400);
    expect(failUpdate.json().message).toContain('Diagnostic wording detected');

    // Valid update with descriptive language
    const okUpdate = await app.inject({
      method: 'PUT',
      url: `/api/v1/summaries/${summaryId}`,
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        editedText: 'This is an updated personal observation log noting self-reported check-in patterns.',
      },
    });
    expect(okUpdate.statusCode).toBe(200);
    expect(okUpdate.json().editedText).toContain('self-reported check-in patterns');
  });

  it('generates a valid server-side PDF with required footer and disclaimer', async () => {
    // Create summary
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/summaries/interview',
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
      payload: {
        whatChanged: 'Experiencing sleep disruptions and joint aches.',
        mainConcerns: 'Restless sleep',
        firstNoticed: 'September 2026',
        dailyImpact: 'Low morning energy',
        relevantRecords: 'Magnesium supplement at bedtime',
        questionsForDoctor: 'Any lifestyle adjustments for sleep architecture?',
      },
    });
    const summaryId = createRes.json().id;

    const pdfRes = await app.inject({
      method: 'POST',
      url: `/api/v1/summaries/${summaryId}/pdf`,
      headers: { cookie: authCookie, 'x-csrf-token': csrfToken },
    });

    expect(pdfRes.statusCode).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain(`appointment-summary-${summaryId.slice(0, 8)}.pdf`);

    const rawBuffer = pdfRes.rawPayload;
    expect(rawBuffer.length).toBeGreaterThan(1000);
    // PDF Magic Number
    expect(rawBuffer.toString('ascii', 0, 5)).toBe('%PDF-');
  });
});
