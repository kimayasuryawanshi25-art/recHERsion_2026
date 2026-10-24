import { and, eq, isNull, inArray } from 'drizzle-orm';
import { evaluateRules, type ObservationOutput, type SymptomEntry } from '@rechersion/shared';
import { db } from '../db/index.js';
import { symptomEntries } from '../db/schema.js';
import { cryptoService } from './crypto.service.js';
import { config } from '../config.js';

export class RulesService {
  async getActiveUserEntries(userId: string, from?: string, to?: string): Promise<SymptomEntry[]> {
    const rows = await db.query.symptomEntries.findMany({
      where: and(
        eq(symptomEntries.userId, userId),
        isNull(symptomEntries.deletedAt)
      ),
    });

    const entries: SymptomEntry[] = rows.map(r => ({
      id: r.id,
      eventDate: r.eventDate,
      eventTime: r.eventTime,
      date: r.eventDate,
      time: r.eventTime || undefined,
      symptom: r.symptom,
      severity: r.severity as any,
      mood: r.mood ?? null,
      energy: r.energy ?? null,
      sleepQuality: r.sleepQuality ?? null,
      dailyImpact: cryptoService.decryptField(r.dailyImpactEncrypted),
      notes: cryptoService.decryptField(r.notesEncrypted),
      medications: cryptoService.decryptField(r.medicationsEncrypted),
      contexts: JSON.parse(r.contexts || '[]'),
      recordedAt: r.recordedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt || undefined,
    }));

    return entries.filter(e => {
      const d = e.eventDate || e.date;
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  async computeObservations(userId: string, from?: string, to?: string): Promise<ObservationOutput[]> {
    const entries = await this.getActiveUserEntries(userId, from, to);
    const isProduction = config.NODE_ENV === 'production';

    return evaluateRules(entries, {
      startDate: from,
      endDate: to,
      isProduction,
    });
  }

  async getObservationEvidence(userId: string, observationId: string, from?: string, to?: string): Promise<SymptomEntry[]> {
    const observations = await this.computeObservations(userId, from, to);
    const obs = observations.find(o => o.id === observationId);
    if (!obs || obs.supportingEntryIds.length === 0) {
      return [];
    }

    const rows = await db.query.symptomEntries.findMany({
      where: and(
        eq(symptomEntries.userId, userId),
        isNull(symptomEntries.deletedAt),
        inArray(symptomEntries.id, obs.supportingEntryIds)
      ),
    });

    return rows.map(r => ({
      id: r.id,
      eventDate: r.eventDate,
      eventTime: r.eventTime,
      date: r.eventDate,
      time: r.eventTime || undefined,
      symptom: r.symptom,
      severity: r.severity as any,
      mood: r.mood ?? null,
      energy: r.energy ?? null,
      sleepQuality: r.sleepQuality ?? null,
      dailyImpact: cryptoService.decryptField(r.dailyImpactEncrypted),
      notes: cryptoService.decryptField(r.notesEncrypted),
      medications: cryptoService.decryptField(r.medicationsEncrypted),
      contexts: JSON.parse(r.contexts || '[]'),
      recordedAt: r.recordedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      clientUpdatedAt: r.clientUpdatedAt || undefined,
    }));
  }
}

export const rulesService = new RulesService();
