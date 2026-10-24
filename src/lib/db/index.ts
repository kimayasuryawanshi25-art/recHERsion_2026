import { openDB, type IDBPDatabase } from 'idb';
import type { SymptomEntry, UserSettings, ConsultationSummary, ExportData } from '../../types/health';

const DB_NAME = 'herhealth-companion';
const DB_VERSION = 5;

export interface OutboxItem {
  id: string;
  type:
    | 'symptom_entry'
    | 'medication'
    | 'appointment'
    | 'screening'
    | 'profile_section'
    | 'health_item'
    | 'life_event'
    | 'care_team'
    | 'medicine_event'
    | 'appointment_debrief'
    | 'followup_task';
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
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('profileSections')) {
            db.createObjectStore('profileSections', { keyPath: 'sectionKey' });
          }
          if (!db.objectStoreNames.contains('healthItems')) {
            db.createObjectStore('healthItems', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('lifeEvents')) {
            db.createObjectStore('lifeEvents', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('careTeam')) {
            db.createObjectStore('careTeam', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('medicineEvents')) {
            db.createObjectStore('medicineEvents', { keyPath: 'id' });
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('appointmentDebriefs')) {
            db.createObjectStore('appointmentDebriefs', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('followupTasks')) {
            db.createObjectStore('followupTasks', { keyPath: 'id' });
          }
        }
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('recordsVault')) {
            db.createObjectStore('recordsVault', { keyPath: 'id' });
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

// Profile Sections
export async function getProfileSection(sectionKey: string): Promise<any> {
  const db = await getDB();
  const row = await db.get('profileSections', sectionKey);
  return row?.content || null;
}

export async function saveProfileSection(sectionKey: string, content: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.put('profileSections', { sectionKey, content, updatedAt: now });
  await queueOutbox({
    type: 'profile_section',
    action: 'upsert',
    recordId: sectionKey,
    clientUpdatedAt: now,
    data: { sectionKey, content },
  });
}

export async function getAllProfileSections(): Promise<Record<string, any>> {
  const db = await getDB();
  const rows = await db.getAll('profileSections');
  const sections: Record<string, any> = {};
  for (const r of rows) {
    sections[r.sectionKey] = r.content;
  }
  return sections;
}

// Health Items
export async function getHealthItems(kind?: string): Promise<any[]> {
  const db = await getDB();
  const items = await db.getAll('healthItems');
  const active = items.filter((i: any) => !i.deletedAt);
  return kind ? active.filter((i: any) => i.kind === kind) : active;
}

export async function saveHealthItem(item: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...item, updatedAt: now };
  await db.put('healthItems', record);
  await queueOutbox({
    type: 'health_item',
    action: 'upsert',
    recordId: item.id,
    clientUpdatedAt: now,
    data: record,
  });
}

export async function deleteHealthItem(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('healthItems', id);
  const now = new Date().toISOString();
  if (item) {
    item.deletedAt = now;
    await db.put('healthItems', item);
  }
  await queueOutbox({
    type: 'health_item',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: now,
  });
}

// Life Events
export async function getLifeEvents(): Promise<any[]> {
  const db = await getDB();
  const events = await db.getAll('lifeEvents');
  return events.filter((e: any) => !e.deletedAt);
}

export async function saveLifeEvent(event: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...event, updatedAt: now };
  await db.put('lifeEvents', record);
  await queueOutbox({
    type: 'life_event',
    action: 'upsert',
    recordId: event.id,
    clientUpdatedAt: now,
    data: record,
  });
}

export async function deleteLifeEvent(id: string): Promise<void> {
  const db = await getDB();
  const event = await db.get('lifeEvents', id);
  const now = new Date().toISOString();
  if (event) {
    event.deletedAt = now;
    await db.put('lifeEvents', event);
  }
  await queueOutbox({
    type: 'life_event',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: now,
  });
}

// Care Team
export async function getCareTeam(): Promise<any[]> {
  const db = await getDB();
  const members = await db.getAll('careTeam');
  return members.filter((m: any) => !m.deletedAt);
}

export async function saveCareTeamMember(member: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...member, updatedAt: now };
  await db.put('careTeam', record);
  await queueOutbox({
    type: 'care_team',
    action: 'upsert',
    recordId: member.id,
    clientUpdatedAt: now,
    data: record,
  });
}

export async function deleteCareTeamMember(id: string): Promise<void> {
  const db = await getDB();
  const member = await db.get('careTeam', id);
  const now = new Date().toISOString();
  if (member) {
    member.deletedAt = now;
    await db.put('careTeam', member);
  }
  await queueOutbox({
    type: 'care_team',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: now,
  });
}

// Medicine Events
export async function getMedicineEvents(): Promise<any[]> {
  const db = await getDB();
  const meds = await db.getAll('medicineEvents');
  return meds.filter((m: any) => !m.deletedAt);
}

export async function saveMedicineEvent(med: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...med, updatedAt: now };
  await db.put('medicineEvents', record);
  await queueOutbox({
    type: 'medicine_event',
    action: 'upsert',
    recordId: med.id,
    clientUpdatedAt: now,
    data: record,
  });
}

export async function deleteMedicineEvent(id: string): Promise<void> {
  const db = await getDB();
  const med = await db.get('medicineEvents', id);
  const now = new Date().toISOString();
  if (med) {
    med.deletedAt = now;
    await db.put('medicineEvents', med);
  }
  await queueOutbox({
    type: 'medicine_event',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: now,
  });
}

// Appointment Debriefs
export async function getAppointmentDebriefs(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('appointmentDebriefs');
}

export async function getAppointmentDebrief(id: string): Promise<any | undefined> {
  const db = await getDB();
  return db.get('appointmentDebriefs', id);
}

export async function saveAppointmentDebrief(debrief: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...debrief, updatedAt: debrief.updatedAt || now, createdAt: debrief.createdAt || now };
  await db.put('appointmentDebriefs', record);
  await queueOutbox({
    type: 'appointment_debrief',
    action: 'upsert',
    recordId: debrief.id,
    clientUpdatedAt: now,
    data: record,
  });
}

// Follow-up Tasks
export async function getFollowupTasks(debriefId?: string): Promise<any[]> {
  const db = await getDB();
  const tasks = await db.getAll('followupTasks');
  if (debriefId) {
    return tasks.filter((t: any) => t.debriefId === debriefId && !t.deletedAt);
  }
  return tasks.filter((t: any) => !t.deletedAt);
}

export async function saveFollowupTask(task: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...task, updatedAt: now, createdAt: task.createdAt || now };
  await db.put('followupTasks', record);
  await queueOutbox({
    type: 'followup_task',
    action: 'upsert',
    recordId: task.id,
    clientUpdatedAt: now,
    data: record,
  });
}

export async function deleteFollowupTask(id: string): Promise<void> {
  const db = await getDB();
  const task = await db.get('followupTasks', id);
  const now = new Date().toISOString();
  if (task) {
    task.deletedAt = now;
    await db.put('followupTasks', task);
  }
  await queueOutbox({
    type: 'followup_task',
    action: 'delete',
    recordId: id,
    clientUpdatedAt: now,
  });
}

// Local Records Vault
export async function getVaultRecords(): Promise<any[]> {
  const db = await getDB();
  const records = await db.getAll('recordsVault');
  return records.filter((r: any) => !r.deletedAt);
}

export async function saveVaultRecord(record: any): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const updated = {
    ...record,
    createdAt: record.createdAt || now,
    updatedAt: now,
  };
  await db.put('recordsVault', updated);
}

export async function deleteVaultRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('recordsVault', id);
  if (record) {
    record.deletedAt = new Date().toISOString();
    await db.put('recordsVault', record);
  }
}

// Bulk operations
export async function deleteAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('symptomEntries');
  await db.clear('settings');
  await db.clear('consultations');
  await db.clear('profileSections');
  await db.clear('healthItems');
  await db.clear('lifeEvents');
  await db.clear('careTeam');
  await db.clear('medicineEvents');
  await db.clear('appointmentDebriefs');
  await db.clear('followupTasks');
  await db.clear('recordsVault');
  await db.clear('outbox');
  await db.clear('syncMeta');
}

export async function exportAllData(): Promise<ExportData> {
  const settings = await getSettings();
  const entries = await getAllEntries();
  const consultations = await getAllConsultations();
  const profileSections = await getAllProfileSections();
  const healthItems = await getHealthItems();
  const lifeEvents = await getLifeEvents();
  const careTeam = await getCareTeam();
  const medicineEvents = await getMedicineEvents();
  const appointmentDebriefs = await getAppointmentDebriefs();
  const followupTasks = await getFollowupTasks();

  return {
    schemaVersion: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'HerHealth Companion',
    settings,
    symptomEntries: entries,
    consultationSummaries: consultations,
    profileSections,
    healthItems,
    lifeEvents,
    careTeam,
    medicineEvents,
    appointmentDebriefs,
    followupTasks,
  } as any;
}

export async function importData(
  data: ExportData,
  mode: 'merge' | 'replace'
): Promise<{ imported: number; skipped: number; errors: string[] }> {
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
        if (existing) {
          result.skipped++;
          continue;
        }
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
        if (existing) {
          result.skipped++;
          continue;
        }
      }
      await db.put('consultations', c);
      result.imported++;
    } catch (e) {
      result.errors.push(`Consultation ${c.id}: ${e}`);
    }
  }

  if (data.profileSections) {
    for (const [sectionKey, content] of Object.entries(data.profileSections)) {
      try {
        await db.put('profileSections', { sectionKey, content, updatedAt: new Date().toISOString() });
        result.imported++;
      } catch (e) {
        result.errors.push(`ProfileSection ${sectionKey}: ${e}`);
      }
    }
  }

  for (const item of data.healthItems || []) {
    try {
      await db.put('healthItems', item);
      result.imported++;
    } catch (e) {
      result.errors.push(`HealthItem ${item.id}: ${e}`);
    }
  }

  for (const event of data.lifeEvents || []) {
    try {
      await db.put('lifeEvents', event);
      result.imported++;
    } catch (e) {
      result.errors.push(`LifeEvent ${event.id}: ${e}`);
    }
  }

  for (const m of data.careTeam || []) {
    try {
      await db.put('careTeam', m);
      result.imported++;
    } catch (e) {
      result.errors.push(`CareTeam ${m.id}: ${e}`);
    }
  }

  for (const med of data.medicineEvents || []) {
    try {
      await db.put('medicineEvents', med);
      result.imported++;
    } catch (e) {
      result.errors.push(`MedicineEvent ${med.id}: ${e}`);
    }
  }

  return result;
}
