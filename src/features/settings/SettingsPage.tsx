
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRound,
  Eye,
  Download,
  Upload,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Save,
  Cloud,
  LogOut,
  RefreshCw,
  Lock,
  Shield,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { pinLockService } from '../../lib/safety/pinLock';

import {
  deleteAllData,
  exportAllData,
  getSettings,
  importData,
  saveSettings,
} from '../../lib/db';
import type { ExportData, UserSettings } from '../../types/health';
import { AuthModal } from '../auth/AuthModal';
import { syncManager, type SyncStatus } from '../../lib/sync/syncWorker';
import { api } from '../../lib/api';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [userEmail, setUserEmail] = useState<string | null>(syncManager.getUserEmail());
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [isConfiguringPin, setIsConfiguringPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [aiConsent, setAiConsent] = useState(false);

  useEffect(() => {
    getSettings().then(saved => {
      if (saved) {
        setSettings(saved);
        setDisplayName(saved.displayName ?? '');
      }
    });

    pinLockService.isPinEnabled().then(setPinEnabled);

    const unsub = syncManager.subscribe((st, em) => {
      setSyncStatus(st);
      setUserEmail(em ?? null);
      if (em) {
        api.ai.getConsents().then(res => {
          setAiConsent(Boolean(res?.consents?.ai_summary));
        }).catch(() => {});
      }
    });
    return unsub;
  }, []);

  const handleToggleAiConsent = async () => {
    try {
      const nextVal = !aiConsent;
      await api.ai.updateConsent('ai_summary', nextVal);
      setAiConsent(nextVal);
      setMessage(nextVal ? 'AI summary assistance enabled with non-diagnostic guardrails.' : 'AI summary assistance disabled.');
    } catch {
      setMessage('Failed to update AI consent settings.');
    }
  };

  const handleSavePin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('PIN must be 4 to 6 numeric digits');
      return;
    }
    await pinLockService.setPin(newPin);
    setPinEnabled(true);
    setIsConfiguringPin(false);
    setNewPin('');
    setPinError('');
    setMessage('Security PIN set successfully. The app will auto-lock after 5 minutes of inactivity.');
  };

  const handleDisablePin = async () => {
    if (window.confirm('Are you sure you want to disable PIN lock protection?')) {
      await pinLockService.disablePin();
      setPinEnabled(false);
      setIsConfiguringPin(false);
      setMessage('Security PIN protection disabled.');
    }
  };

  const handleLockNow = () => {
    pinLockService.lock();
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      await syncManager.onUserLogout();
      setMessage('Signed out successfully.');
    } catch {
      setMessage('Failed to sign out.');
    }
  };

  const handleSyncNow = async () => {
    try {
      await syncManager.syncNow();
      setMessage('Sync completed.');
    } catch {
      setMessage('Sync failed. Please check connection.');
    }
  };

  const saveProfile = async () => {
    if (!settings) return;

    const updated: UserSettings = {
      ...settings,
      displayName: displayName.trim(),
      updatedAt: new Date().toISOString(),
    };

    await saveSettings(updated);
    setSettings(updated);
    setMessage('Your local profile has been saved.');
  };

  const toggleDiscreetMode = async () => {
    if (!settings) return;

    const updated: UserSettings = {
      ...settings,
      discreetMode: !settings.discreetMode,
      updatedAt: new Date().toISOString(),
    };

    await saveSettings(updated);
    setSettings(updated);
    setMessage('Discreet mode preference saved.');
  };

  const downloadBackup = async () => {
    setBusy(true);
    setMessage('');

    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `herhealth-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage('Backup exported. Store the file somewhere private.');
    } catch {
      setMessage('Could not export your backup. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (file?: File) => {
    if (!file) return;

    setBusy(true);
    setMessage('');

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('schemaVersion' in parsed) ||
        !('symptomEntries' in parsed) ||
        !('consultationSummaries' in parsed) ||
        !Array.isArray(parsed.symptomEntries) ||
        !Array.isArray(parsed.consultationSummaries)
      ) {
        throw new Error('This does not look like a HerHealth backup.');
      }

      const mode = window.confirm(
        'Choose OK to merge this backup with your current data. Choose Cancel to replace your current data with the backup.'
      )
        ? 'merge'
        : 'replace';

      if (
        mode === 'replace' &&
        !window.confirm(
          'Replace mode deletes the current local data before importing. Continue?'
        )
      ) {
        setMessage('Import cancelled.');
        return;
      }

      const result = await importData(parsed as ExportData, mode);
      const latestSettings = await getSettings();

      setSettings(latestSettings ?? null);
      setDisplayName(latestSettings?.displayName ?? '');
      setMessage(
        `Import finished. Imported: ${result.imported}; skipped: ${result.skipped}; errors: ${result.errors.length}.`
      );
    } catch {
      setMessage(
        'Import failed. Please choose a valid HerHealth JSON backup.'
      );
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const eraseLocalData = async () => {
    const confirmed = window.confirm(
      'This permanently deletes all HerHealth entries, settings, and consultation summaries stored in this browser. Export a backup first if you need one. Continue?'
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      'Are you sure? This action cannot be undone.'
    );

    if (!secondConfirmation) return;

    setBusy(true);

    try {
      await deleteAllData();
      navigate('/onboarding', { replace: true });
      window.location.reload();
    } catch {
      setMessage('Could not delete the local data. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-7">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
          Personal preferences
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Make this space feel comfortable for you and stay in control of the
          information saved in your browser.
        </p>
      </header>

      {message && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <section className="app-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum-100 text-plum-700">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-stone-800">Local profile</h2>
            <p className="mt-1 text-sm text-stone-500">
              Personalise the app on this device.
            </p>
          </div>
        </div>

        <label
          htmlFor="displayName"
          className="mb-2 block text-sm font-medium text-stone-700"
        >
          What should we call you?
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={event => setDisplayName(event.target.value)}
          maxLength={60}
          placeholder="Enter a display name (optional)"
          className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none transition focus:border-plum-400 focus:bg-white"
        />
        <p className="mt-2 text-xs text-stone-400">
          This is optional and is not an online account or login.
        </p>

        <button
          type="button"
          onClick={saveProfile}
          disabled={!settings}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-plum-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-plum-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save profile
        </button>
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDE7F6] text-[#5B4B8A]">
            <Eye className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-stone-800">Discreet mode</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Use a more discreet app name and less revealing navigation
              labels when someone might see your screen.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings?.discreetMode ?? false}
            aria-label="Toggle discreet mode"
            onClick={toggleDiscreetMode}
            disabled={!settings}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
              settings?.discreetMode ? 'bg-teal-600' : 'bg-stone-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                settings?.discreetMode ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-4 rounded-xl bg-sand-50 p-3 text-xs leading-5 text-stone-500">
          Discreet mode changes what appears on screen. It does not lock the
          app, encrypt data, or prevent someone with browser access from
          opening your records.
        </p>
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-stone-800">App Lock (Security PIN)</h2>
              <p className="mt-1 text-sm text-stone-500">
                Protect your journal with a local WebCrypto PBKDF2/SHA-256 PIN. Auto-locks after 5 minutes of inactivity.
              </p>
            </div>
          </div>
          {pinEnabled && (
            <button
              type="button"
              onClick={handleLockNow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              <Lock className="h-3.5 w-3.5" />
              Lock Now
            </button>
          )}
        </div>

        {pinEnabled ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-teal-900 font-medium">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              <span>PIN lock protection is active on this device.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfiguringPin(true)}
                className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-sand-50"
              >
                Change PIN
              </button>
              <button
                type="button"
                onClick={handleDisablePin}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                Disable PIN
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!isConfiguringPin ? (
              <button
                type="button"
                onClick={() => setIsConfiguringPin(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-plum-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
              >
                <KeyRound className="h-4 w-4" />
                Enable PIN Lock
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-sand-200 bg-sand-50 p-4 max-w-md">
                <label htmlFor="newPinInput" className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Enter 4-6 Digit Numeric PIN
                </label>
                <div className="flex gap-2">
                  <input
                    id="newPinInput"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={e => {
                      setNewPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder="••••"
                    className="w-32 rounded-xl border border-sand-300 bg-white px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-plum-500"
                  />
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white hover:bg-plum-700"
                  >
                    Save & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfiguringPin(false);
                      setNewPin('');
                      setPinError('');
                    }}
                    className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-sand-100"
                  >
                    Cancel
                  </button>
                </div>
                {pinError && <p className="text-xs text-rose-600">{pinError}</p>}
                <p className="text-xs text-stone-500">
                  Your PIN is cryptographically hashed with a random salt in IndexedDB. It is never sent to any server.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum-100 text-plum-700">
            <Cloud className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-stone-800">Account & Cloud Sync (Optional)</h2>
            <p className="mt-1 text-sm text-stone-500">
              Sync your encrypted journal across your devices. Local-only mode works 100% without an account.
            </p>
          </div>
        </div>

        {userEmail ? (
          <div className="rounded-xl border border-sand-200 bg-sand-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Signed in as</div>
                <div className="text-sm font-bold text-stone-900">{userEmail}</div>
                <div className="text-xs text-teal-700 mt-0.5">Status: {syncStatus}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-sand-100 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sand-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-800">AI Consultation Scribe (Consent)</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Allow server-side AI drafting of consultation summaries using selected records with strict non-diagnostic guardrails.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={aiConsent}
                  onClick={handleToggleAiConsent}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${aiConsent ? 'bg-purple-600' : 'bg-stone-300'}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${aiConsent ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-stone-600 mb-4">
              You are currently using <strong>Local-Only Mode</strong>. Your data never leaves this browser unless you sign in.
            </p>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-plum-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
            >
              <Cloud className="h-4 w-4" />
              Sign In or Create Account
            </button>
          </div>
        )}
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <HardDrive className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-stone-800">Your data</h2>
            <p className="mt-1 text-sm text-stone-500">
              Back up or restore your health journal.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={downloadBackup}
            disabled={busy}
            className="flex items-center gap-3 rounded-xl border border-sand-200 p-4 text-left transition hover:border-plum-200 hover:bg-plum-50 disabled:opacity-50"
          >
            <Download className="h-5 w-5 shrink-0 text-plum-600" />
            <span>
              <span className="block text-sm font-semibold text-stone-700">
                Export backup
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                Download your data as JSON
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="flex items-center gap-3 rounded-xl border border-sand-200 p-4 text-left transition hover:border-teal-200 hover:bg-teal-50 disabled:opacity-50"
          >
            <Upload className="h-5 w-5 shrink-0 text-teal-700" />
            <span>
              <span className="block text-sm font-semibold text-stone-700">
                Import backup
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                Restore a previous JSON export
              </span>
            </span>
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={event => handleImport(event.target.files?.[0])}
        />

        <p className="mt-4 text-xs leading-5 text-stone-500">
          A backup can contain sensitive health information. Keep the exported
          file somewhere private. Import only backups you trust.
        </p>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B4B8A]">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-rose-900">Delete local data</h2>
            <p className="mt-1 text-sm leading-6 text-rose-800/80">
              Permanently remove journal entries, settings, and consultation
              summaries saved by this app in this browser.
            </p>
            <button
              type="button"
              onClick={eraseLocalData}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-[#EDE7F6] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete all local data
            </button>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-rose-800/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          This cannot be undone. Export a backup first if you may need your
          records later.
        </p>
      </section>

      <div className="pb-4 text-center text-xs text-stone-400">
        HerHealth Companion · Your health information, on your terms.
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
