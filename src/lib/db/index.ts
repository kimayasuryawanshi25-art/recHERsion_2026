import { openDB, type IDBPDatabase } from 'idb';
import type { SymptomEntry, UserSettings, ConsultationSummary, ExportData } from '../../types/health';

const DB_NAME = 'herhealth-companion';
const DB_VERSION = 2;

export interface OutboxItem {
  id: string;
  type: 'symptom_entry' | 'medication' | 'appointment' | 'screening';
  action: 'upsert' | 'delete';
  recordId: string;
  clientUpdatedAt: string;
  data?: any;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('symptomEntries')) {
          const s = db.createObjectStore('symptomEntries', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('consultations')) {
          db.createObjectStore('consultations', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('outbox')) {
            db.createObjectStore('outbox', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('syncMeta')) {
            db.createObjectStore('syncMeta', { keyPath: 'key' });
          }
        }
      },
    });
  }
  return dbPromise;
}

// Settings
export async function getSettings(): Promise<UserSettings | undefined> {
  const db = await getDB();
  return db.get('settings', 'user-settings');
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', s);
}

// Outbox and Sync Meta
export async function queueOutbox(item: Omit<OutboxItem, 'id'>): Promise<void> {
  const db = await getDB();
  const id = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await db.put('outbox', { ...item, id });
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAll('outbox');
}

export async function clearOutboxItems(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('outbox', 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

export async function getSyncMeta<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const record = await db.get('syncMeta', key);
  return record?.value;
}

export async function setSyncMeta(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('syncMeta', { key, value });
}

// Symptom entries
export async function getAllEntries(): Promise<SymptomEntry[]> {
  const db = await getDB();
  return db.getAll('symptomEntries');
}

export async function getEntry(id: string): Promise<SymptomEntry | undefined> {
  const db = await getDB();
  return db.get('symptomEntries', id);
}

export async function saveEntry(e: SymptomEntry): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const updatedEntry = {
    ...e,
    clientUpdatedAt: e.clientUpdatedAt || now,
  };
  await db.put('symptomEntries', updatedEntry);

  // Queue to outbox for background sync
  await queueOutbox({
    type: 'symptom_entry',
    action: 'upsert',
    recordId: e.id,
    clientUpdatedAt: updatedEntry.clientUpdatedAt,
    data: updatedEntry,
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('symptomEntries', id);

  // Queue delete to outbox
  await queueOutbox({
    type: 'symptom_entry',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: new Date().toISOString(),
  });
}

// Direct local upsert without queueing to outbox (used when pulling from server)
export async function upsertRemoteEntry(e: SymptomEntry): Promise<void> {
  const db = await getDB();
  await db.put('symptomEntries', e);
}

// Consultations
export async function getAllConsultations(): Promise<ConsultationSummary[]> {
  const db = await getDB();
  return db.getAll('consultations');
}

export async function saveConsultation(c: ConsultationSummary): Promise<void> {
  const db = await getDB();
  await db.put('consultations', c);
}

export async function deleteConsultation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('consultations', id);
}

// Bulk operations
export async function deleteAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('symptomEntries');
  await db.clear('settings');
  await db.clear('consultations');
  await db.clear('outbox');
  await db.clear('syncMeta');
}

export async function exportAllData(): Promise<ExportData> {
  const settings = await getSettings();
  const entries = await getAllEntries();
  const consultations = await getAllConsultations();
  return {
    schemaVersion: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'HerHealth Companion',
    settings,
    symptomEntries: entries,
    consultationSummaries: consultations,
  };
}

export async function importData(data: ExportData, mode: 'merge' | 'replace'): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  if (mode === 'replace') await deleteAllData();
  const db = await getDB();

  if (data.settings) {
    await db.put('settings', data.settings);
    result.imported++;
  }

  for (const entry of data.symptomEntries || []) {
    try {
      if (mode === 'merge') {
        const existing = await db.get('symptomEntries', entry.id);
        if (existing) { result.skipped++; continue; }
      }
      await db.put('symptomEntries', entry);
      result.imported++;
    } catch (e) {
      result.errors.push(`Entry ${entry.id}: ${e}`);
    }
  }

  for (const c of data.consultationSummaries || []) {
    try {
      if (mode === 'merge') {
        const existing = await db.get('consultations', c.id);
        if (existing) { result.skipped++; continue; }
      }
      await db.put('consultations', c);
      result.imported++;
    } catch (e) {
      result.errors.push(`Consultation ${c.id}: ${e}`);
    }
  }
  return result;
}
