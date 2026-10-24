import { eq, and, isNull, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { consultationSummaries, symptomEntries, appointments, screeningRecords, auditEvents } from '../db/schema.js';
import { cryptoService } from './crypto.service.js';
import { getEntryDate, assertDescriptiveWording } from '@rechersion/shared';
import type { SummaryInterviewInput, SummarySection, UpdateSummaryInput } from '@rechersion/shared';

export interface AssembledSummaryResult {
  id: string;
  userId: string;
  whatChanged: string;
  mainConcerns: string;
  firstNoticed: string;
  dailyImpact: string;
  relevantRecords: string;
  questionsForDoctor: string;
  selectedEntryIds: string[];
  sections: SummarySection[];
  generatedText: string;
  editedText: string;
  createdAt: string;
  updatedAt: string;
}

export async function assembleConsultationSummary(
  userId: string,
  input: SummaryInterviewInput
): Promise<AssembledSummaryResult> {
  const now = new Date().toISOString();
  const summaryId = crypto.randomUUID();

  // 1. Fetch user symptom entries
  const allEntries = await db
    .select()
    .from(symptomEntries)
    .where(and(eq(symptomEntries.userId, userId), isNull(symptomEntries.deletedAt)))
    .orderBy(desc(symptomEntries.eventDate));

  let chosenEntries = allEntries;
  if (input.selectedEntryIds && input.selectedEntryIds.length > 0) {
    const selectedSet = new Set(input.selectedEntryIds);
    chosenEntries = allEntries.filter(e => selectedSet.has(e.id));
  } else {
    // Default to most recent 20
    chosenEntries = allEntries.slice(0, 20);
  }

  // 2. Compute Entry Statistics (strictly preserving nulls as unrecorded)
  let recordedSymptomsText = '';
  if (chosenEntries.length > 0) {
    const dates = chosenEntries.map(e => getEntryDate(e)).filter(Boolean).sort();
    const start = dates[0] || '';
    const end = dates[dates.length - 1] || '';
    const lines: string[] = [
      `Based on ${chosenEntries.length} check-in${chosenEntries.length === 1 ? '' : 's'} (${start} to ${end}):`,
    ];

    const freq: Record<string, number> = {};
    for (const e of chosenEntries) {
      freq[e.symptom] = (freq[e.symptom] || 0) + 1;
    }
    const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    for (const [sym, count] of sortedFreq) {
      lines.push(`  • ${sym}: recorded ${count} time${count === 1 ? '' : 's'}`);
    }

    const withSev = chosenEntries.filter(e => e.severity !== null && e.severity !== undefined);
    if (withSev.length > 0) {
      const avg = (withSev.reduce((sum, e) => sum + (e.severity || 0), 0) / withSev.length).toFixed(1);
      lines.push(`  • Average self-reported severity: ${avg}/5 (based on ${withSev.length} recorded check-in${withSev.length === 1 ? '' : 's'}; ${chosenEntries.length - withSev.length} check-ins did not record severity)`);
    } else {
      lines.push('  • Severity: not recorded across these check-ins');
    }

    recordedSymptomsText = lines.join('\n');
  }

  // 3. Wellbeing notes
  let wellbeingText = '';
  const poorSleep = chosenEntries.filter(e => e.sleepQuality !== null && e.sleepQuality !== undefined && e.sleepQuality <= 2).length;
  const lowMood = chosenEntries.filter(e => e.mood !== null && e.mood !== undefined && e.mood <= 2).length;
  if (poorSleep > 0 || lowMood > 0) {
    const lines: string[] = [];
    if (poorSleep > 0) {
      lines.push(`  • Low sleep quality recorded in ${poorSleep} check-in${poorSleep === 1 ? '' : 's'}`);
    }
    if (lowMood > 0) {
      lines.push(`  • Low mood recorded in ${lowMood} check-in${lowMood === 1 ? '' : 's'}`);
    }
    wellbeingText = lines.join('\n');
  }

  // 4. Appointments (optional)
  let appointmentsText = '';
  if (input.includeAppointments) {
    const userAppointments = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.userId, userId), isNull(appointments.deletedAt)))
      .orderBy(desc(appointments.eventDate));

    if (userAppointments.length > 0) {
      const apptLines: string[] = [];
      for (const appt of userAppointments.slice(0, 5)) {
        const prov = appt.providerName ? ` with ${appt.providerName}` : '';
        const spec = appt.specialty ? ` (${appt.specialty})` : '';
        const notes = appt.notesEncrypted ? `: ${cryptoService.decryptField(appt.notesEncrypted)}` : '';
        apptLines.push(`  • ${appt.eventDate}${prov}${spec}${notes}`);
      }
      appointmentsText = apptLines.join('\n');
    }
  }

  // 5. Screenings (optional)
  let screeningsText = '';
  if (input.includeScreenings) {
    const userScreenings = await db
      .select()
      .from(screeningRecords)
      .where(and(eq(screeningRecords.userId, userId), isNull(screeningRecords.deletedAt)))
      .orderBy(desc(screeningRecords.createdAt));

    if (userScreenings.length > 0) {
      const scLines: string[] = [];
      for (const sc of userScreenings) {
        const details = sc.completedDate
          ? `completed on ${sc.completedDate}`
          : sc.dueDate
          ? `due on or around ${sc.dueDate}`
          : `status: ${sc.state.replace('_', ' ')}`;
        scLines.push(`  • ${sc.screeningType.toUpperCase()}: ${details}`);
      }
      screeningsText = scLines.join('\n');
    }
  }

  // 6. Build default raw sections
  const rawSections: SummarySection[] = [
    {
      id: 'header',
      title: 'SUMMARY HEADER',
      content: `═══════════════════════════════════════\n  APPOINTMENT PREPARATION SUMMARY\n  Generated by HerHealth Companion\n  Date: ${new Date().toLocaleDateString()}\n═══════════════════════════════════════`,
      enabled: true,
      order: 1,
    },
    {
      id: 'disclaimer',
      title: 'CLINICAL NOTICE',
      content: '⚕ This is user-provided information, not a clinical assessment, medical diagnosis, or treatment plan.',
      enabled: true,
      order: 2,
    },
  ];

  let orderCount = 3;

  if ((input.whatChanged || '').trim()) {
    rawSections.push({
      id: 'whatChanged',
      title: 'RECENT CHANGES',
      content: (input.whatChanged || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  if ((input.mainConcerns || '').trim()) {
    rawSections.push({
      id: 'mainConcerns',
      title: 'MAIN CONCERNS',
      content: (input.mainConcerns || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  if ((input.firstNoticed || '').trim()) {
    rawSections.push({
      id: 'firstNoticed',
      title: 'WHEN FIRST NOTICED',
      content: (input.firstNoticed || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  if (recordedSymptomsText) {
    rawSections.push({
      id: 'recordedSymptoms',
      title: 'RECORDED SYMPTOMS',
      content: recordedSymptomsText,
      enabled: true,
      order: orderCount++,
    });
  }

  if ((input.dailyImpact || '').trim()) {
    rawSections.push({
      id: 'dailyImpact',
      title: 'IMPACT ON DAILY ACTIVITIES',
      content: (input.dailyImpact || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  if (wellbeingText) {
    rawSections.push({
      id: 'wellbeingNotes',
      title: 'WELLBEING OBSERVATIONS',
      content: wellbeingText,
      enabled: true,
      order: orderCount++,
    });
  }

  if ((input.relevantRecords || '').trim()) {
    rawSections.push({
      id: 'relevantRecords',
      title: 'RELEVANT MEDICINES & RECORDS',
      content: (input.relevantRecords || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  if (screeningsText) {
    rawSections.push({
      id: 'screenings',
      title: 'PREVENTIVE CARE & SCREENINGS',
      content: screeningsText,
      enabled: true,
      order: orderCount++,
    });
  }

  if (appointmentsText) {
    rawSections.push({
      id: 'appointments',
      title: 'APPOINTMENTS & FOLLOW-UPS',
      content: appointmentsText,
      enabled: true,
      order: orderCount++,
    });
  }

  if ((input.questionsForDoctor || '').trim()) {
    rawSections.push({
      id: 'questions',
      title: 'QUESTIONS FOR HEALTHCARE PROFESSIONAL',
      content: (input.questionsForDoctor || '').trim(),
      enabled: true,
      order: orderCount++,
    });
  }

  rawSections.push({
    id: 'footer',
    title: 'NOTICE FOOTER',
    content: '─────────────────────────────────────\nNote: This summary contains self-reported information.\nMissing information may need to be discussed with your healthcare professional.',
    enabled: true,
    order: orderCount++,
  });

  // 7. Apply optional user reordering & toggling if config provided
  let finalSections = rawSections;
  if (input.sectionsConfig && input.sectionsConfig.length > 0) {
    const configMap = new Map(input.sectionsConfig.map(c => [c.id, c]));
    finalSections = rawSections.map(sec => {
      const conf = configMap.get(sec.id);
      if (conf) {
        return {
          ...sec,
          enabled: conf.enabled,
          order: conf.order !== undefined ? conf.order : sec.order,
        };
      }
      return sec;
    });
    finalSections.sort((a, b) => a.order - b.order);
  }

  // 8. Generate text strictly from enabled sections
  const generatedText = finalSections
    .filter(s => s.enabled)
    .map(s => {
      if (s.id === 'header' || s.id === 'disclaimer' || s.id === 'footer') {
        return s.content;
      }
      return `${s.title}\n${s.content}`;
    })
    .join('\n\n');

  // 9. Lint wording to ensure non-diagnostic terminology
  assertDescriptiveWording(generatedText);

  // 10. Persist to DB
  const selectedIds = chosenEntries.map(e => e.id);
  await db.insert(consultationSummaries).values({
    id: summaryId,
    userId,
    whatChanged: input.whatChanged,
    mainConcerns: input.mainConcerns,
    firstNoticed: input.firstNoticed,
    dailyImpact: input.dailyImpact,
    relevantRecords: input.relevantRecords,
    questionsForDoctor: input.questionsForDoctor,
    selectedEntryIds: JSON.stringify(selectedIds),
    sections: JSON.stringify(finalSections),
    generatedText,
    editedText: generatedText,
    createdAt: now,
    updatedAt: now,
  });

  // Non-negotiable rule 6: Never log health content in audit log. Action and ID only.
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    userId,
    action: 'summary_created',
    entityType: 'consultation_summary',
    entityId: summaryId,
    timestamp: now,
  });

  return {
    id: summaryId,
    userId,
    whatChanged: input.whatChanged,
    mainConcerns: input.mainConcerns,
    firstNoticed: input.firstNoticed,
    dailyImpact: input.dailyImpact,
    relevantRecords: input.relevantRecords,
    questionsForDoctor: input.questionsForDoctor,
    selectedEntryIds: selectedIds,
    sections: finalSections,
    generatedText,
    editedText: generatedText,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSummaryById(userId: string, summaryId: string): Promise<AssembledSummaryResult | null> {
  const [row] = await db
    .select()
    .from(consultationSummaries)
    .where(and(eq(consultationSummaries.id, summaryId), eq(consultationSummaries.userId, userId), isNull(consultationSummaries.deletedAt)));

  if (!row) return null;

  let parsedSections: SummarySection[] = [];
  try {
    parsedSections = JSON.parse(row.sections);
  } catch {
    parsedSections = [];
  }

  let parsedEntries: string[] = [];
  try {
    parsedEntries = JSON.parse(row.selectedEntryIds);
  } catch {
    parsedEntries = [];
  }

  return {
    id: row.id,
    userId: row.userId,
    whatChanged: row.whatChanged,
    mainConcerns: row.mainConcerns,
    firstNoticed: row.firstNoticed,
    dailyImpact: row.dailyImpact,
    relevantRecords: row.relevantRecords,
    questionsForDoctor: row.questionsForDoctor,
    selectedEntryIds: parsedEntries,
    sections: parsedSections,
    generatedText: row.generatedText,
    editedText: row.editedText,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateSummary(
  userId: string,
  summaryId: string,
  input: UpdateSummaryInput
): Promise<AssembledSummaryResult | null> {
  const existing = await getSummaryById(userId, summaryId);
  if (!existing) return null;

  const now = new Date().toISOString();

  let newSections = existing.sections;
  if (input.sections) {
    newSections = input.sections;
  }

  let newEditedText = input.editedText !== undefined ? input.editedText : existing.editedText;
  if (input.sections && input.editedText === undefined) {
    // Regenerate edited text from updated enabled sections
    newEditedText = newSections
      .filter(s => s.enabled)
      .map(s => {
        if (s.id === 'header' || s.id === 'disclaimer' || s.id === 'footer') {
          return s.content;
        }
        return `${s.title}\n${s.content}`;
      })
      .join('\n\n');
  }

  // Wording linter check
  if (newEditedText) {
    assertDescriptiveWording(newEditedText);
  }

  await db
    .update(consultationSummaries)
    .set({
      whatChanged: input.whatChanged !== undefined ? input.whatChanged : existing.whatChanged,
      mainConcerns: input.mainConcerns !== undefined ? input.mainConcerns : existing.mainConcerns,
      firstNoticed: input.firstNoticed !== undefined ? input.firstNoticed : existing.firstNoticed,
      dailyImpact: input.dailyImpact !== undefined ? input.dailyImpact : existing.dailyImpact,
      relevantRecords: input.relevantRecords !== undefined ? input.relevantRecords : existing.relevantRecords,
      questionsForDoctor: input.questionsForDoctor !== undefined ? input.questionsForDoctor : existing.questionsForDoctor,
      sections: JSON.stringify(newSections),
      editedText: newEditedText,
      updatedAt: now,
    })
    .where(and(eq(consultationSummaries.id, summaryId), eq(consultationSummaries.userId, userId)));

  // Non-negotiable rule 6: Action and ID only in audit log
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    userId,
    action: 'summary_updated',
    entityType: 'consultation_summary',
    entityId: summaryId,
    timestamp: now,
  });

  return getSummaryById(userId, summaryId);
}
