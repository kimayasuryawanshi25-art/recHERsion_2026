import { api } from '../api';
import {
  getOutboxItems,
  clearOutboxItems,
  getSyncMeta,
  setSyncMeta,
  getAllEntries,
  upsertRemoteEntry,
  deleteEntry,
  queueOutbox,
} from '../db';
import type { SymptomEntry } from '../../types/health';

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'offline' | 'error';

type StatusListener = (status: SyncStatus, userEmail?: string | null) => void;

class SyncManager {
  private status: SyncStatus = 'local_only';
  private currentUserEmail: string | null = null;
  private listeners: Set<StatusListener> = new Set();
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    for (const listener of this.listeners) {
      listener(this.status, this.currentUserEmail);
    }
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  getUserEmail(): string | null {
    return this.currentUserEmail;
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.currentUserEmail);
    return () => this.listeners.delete(listener);
  }

  async init(): Promise<void> {
    await this.checkAuthAndSync();
    // Schedule periodic sync every 30 seconds
    if (typeof window !== 'undefined' && !this.syncTimer) {
      this.syncTimer = setInterval(() => {
        if (this.currentUserEmail && navigator.onLine) {
          this.syncNow().catch(() => {});
        }
      }, 30000);
    }
  }

  private handleNetworkChange() {
    if (!navigator.onLine) {
      this.setStatus('offline');
    } else if (this.currentUserEmail) {
      this.syncNow().catch(() => {});
    } else {
      this.setStatus('local_only');
    }
  }

  async checkAuthAndSync(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    try {
      const me = await api.auth.me();
      if (me && me.user) {
        this.currentUserEmail = me.user.email;
        await this.syncNow();
      } else {
        this.currentUserEmail = null;
        this.setStatus('local_only');
      }
    } catch {
      this.currentUserEmail = null;
      this.setStatus('local_only');
    }
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    if (!this.currentUserEmail) {
      this.setStatus('local_only');
      return;
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      // 1. Push Outbox Items
      const outbox = await getOutboxItems();
      if (outbox.length > 0) {
        await api.sync.push(outbox);
        await clearOutboxItems(outbox.map(item => item.id));
      }

      // 2. Pull Remote Items
      const lastSynced = await getSyncMeta<string>('lastSyncedAt');
      const pullResult = await api.sync.pull(lastSynced);

      if (pullResult && pullResult.entries) {
        for (const remote of pullResult.entries) {
          if (remote.deletedAt) {
            // Apply remote soft-deletion locally
            await deleteEntry(remote.id).catch(() => {});
          } else {
            const entry: SymptomEntry = {
              id: remote.id,
              eventDate: remote.eventDate,
              date: remote.eventDate,
              eventTime: remote.eventTime,
              time: remote.eventTime || '',
              symptom: remote.symptom,
              severity: remote.severity,
              mood: remote.mood,
              energy: remote.energy,
              sleepQuality: remote.sleepQuality,
              dailyImpact: remote.dailyImpact || '',
              notes: remote.notes || '',
              medications: remote.medications || '',
              contexts: remote.contexts || [],
              recordedAt: remote.recordedAt,
              createdAt: remote.createdAt,
              updatedAt: remote.updatedAt,
              clientUpdatedAt: remote.clientUpdatedAt,
            };
            await upsertRemoteEntry(entry);
          }
        }
      }

      await setSyncMeta('lastSyncedAt', pullResult.serverTime || new Date().toISOString());
      this.setStatus('synced');
    } catch (err) {
      console.error('Background sync failed:', err);
      this.setStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      this.isSyncing = false;
    }
  }

  async handleFirstLogin(strategy: 'upload' | 'merge' | 'keep_local'): Promise<void> {
    const localEntries = await getAllEntries();

    if (strategy === 'upload') {
      // Queue all existing local entries to outbox
      for (const entry of localEntries) {
        await queueOutbox({
          type: 'symptom_entry',
          action: 'upsert',
          recordId: entry.id,
          clientUpdatedAt: entry.clientUpdatedAt || new Date().toISOString(),
          data: entry,
        });
      }
      await this.syncNow();
    } else if (strategy === 'merge') {
      // Pull remote entries first, then push local records
      const pullResult = await api.sync.pull();
      if (pullResult && pullResult.entries) {
        for (const remote of pullResult.entries) {
          if (!remote.deletedAt) {
            await upsertRemoteEntry({
              id: remote.id,
              eventDate: remote.eventDate,
              date: remote.eventDate,
              eventTime: remote.eventTime,
              time: remote.eventTime || '',
              symptom: remote.symptom,
              severity: remote.severity,
              mood: remote.mood,
              energy: remote.energy,
              sleepQuality: remote.sleepQuality,
              dailyImpact: remote.dailyImpact || '',
              notes: remote.notes || '',
              medications: remote.medications || '',
              contexts: remote.contexts || [],
              recordedAt: remote.recordedAt,
              createdAt: remote.createdAt,
              updatedAt: remote.updatedAt,
              clientUpdatedAt: remote.clientUpdatedAt,
            });
          }
        }
      }
      for (const entry of localEntries) {
        await queueOutbox({
          type: 'symptom_entry',
          action: 'upsert',
          recordId: entry.id,
          clientUpdatedAt: entry.clientUpdatedAt || new Date().toISOString(),
          data: entry,
        });
      }
      await this.syncNow();
    } else {
      // keep_local: clear outbox so existing local entries are not uploaded
      const outbox = await getOutboxItems();
      await clearOutboxItems(outbox.map(i => i.id));
      await setSyncMeta('lastSyncedAt', new Date().toISOString());
      this.setStatus('synced');
    }
  }

  onUserLogin(email: string) {
    this.currentUserEmail = email;
    this.setStatus('syncing');
  }

  async onUserLogout() {
    this.currentUserEmail = null;
    await setSyncMeta('lastSyncedAt', null);
    this.setStatus('local_only');
  }
}

export const syncManager = new SyncManager();
