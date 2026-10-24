import { useState } from 'react';
import { X, Lock, Mail, Cloud, UploadCloud, RefreshCw, Smartphone, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { getAllEntries } from '../../lib/db';
import { syncManager } from '../../lib/sync/syncWorker';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First-login local data handling state
  const [pendingLocalCount, setPendingLocalCount] = useState<number | null>(null);
  const [migrating, setMigrating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'register') {
        await api.auth.register(email, password);
      } else {
        await api.auth.login(email, password);
      }

      // Check for existing local records
      const localEntries = await getAllEntries();
      if (localEntries.length > 0) {
        setPendingLocalCount(localEntries.length);
        setLoading(false);
        return;
      }

      // No local records, proceed directly
      syncManager.onUserLogin(email);
      await syncManager.syncNow();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrationChoice = async (strategy: 'upload' | 'merge' | 'keep_local') => {
    setMigrating(true);
    try {
      syncManager.onUserLogin(email);
      await syncManager.handleFirstLogin(strategy);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Data sync failed.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-sand-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-stone-400 hover:bg-sand-100 hover:text-stone-700 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {pendingLocalCount !== null ? (
          <div>
            <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-plum-100 p-3 text-plum-700">
              <Cloud className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">Sync Local Records</h2>
            <p className="mt-2 text-sm text-stone-600">
              You have <span className="font-semibold text-plum-700">{pendingLocalCount} check-in{pendingLocalCount === 1 ? '' : 's'}</span> saved on this device. Choose how you would like to handle them:
            </p>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => handleMigrationChoice('upload')}
                disabled={migrating}
                className="w-full flex items-start gap-3 rounded-xl border border-plum-200 bg-plum-50/50 p-3.5 text-left transition hover:border-plum-300 hover:bg-plum-50"
              >
                <UploadCloud className="mt-0.5 h-5 w-5 text-plum-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-plum-900">Upload to my account (Recommended)</div>
                  <div className="text-xs text-plum-700">Copies your local records to your secure encrypted account so they sync across devices.</div>
                </div>
              </button>

              <button
                onClick={() => handleMigrationChoice('merge')}
                disabled={migrating}
                className="w-full flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-3.5 text-left transition hover:border-sand-300 hover:bg-sand-50"
              >
                <RefreshCw className="mt-0.5 h-5 w-5 text-teal-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Merge with existing account data</div>
                  <div className="text-xs text-stone-500">Combines existing account records with your device check-ins without duplicates.</div>
                </div>
              </button>

              <button
                onClick={() => handleMigrationChoice('keep_local')}
                disabled={migrating}
                className="w-full flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-3.5 text-left transition hover:border-sand-300 hover:bg-sand-50"
              >
                <Smartphone className="mt-0.5 h-5 w-5 text-stone-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Keep only on this device</div>
                  <div className="text-xs text-stone-500">Leaves existing records local and only syncs future entries.</div>
                </div>
              </button>
            </div>

            {migrating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-plum-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Applying sync preferences...</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex border-b border-sand-200 mb-5">
              <button
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                  tab === 'login'
                    ? 'border-plum-600 text-plum-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('register'); setError(null); }}
                className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
                  tab === 'register'
                    ? 'border-plum-600 text-plum-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                Create Account
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              {tab === 'login'
                ? 'Sign in to sync your encrypted records across your devices.'
                : 'Create an optional account for encrypted cross-device sync. Local-only mode remains available anytime.'}
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-plum-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-plum-400 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-plum-600 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Free Account'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <Check className="h-3.5 w-3.5 text-teal-600" />
              <span>AES-256 encrypted • Zero telemetry • Local-first</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
