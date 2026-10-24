import { useState } from 'react';
import { X, Share2, Copy, Check, Clock, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summaryId: string;
}

export function ShareDialog({ isOpen, onClose, summaryId }: ShareDialogProps) {
  const [expiryDays, setExpiryDays] = useState(7);
  const [maxViews, setMaxViews] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shareData, setShareData] = useState<{
    id: string;
    rawToken: string;
    expiresAt: string;
    maxViews: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.share.create(summaryId, expiryDays, maxViews);
      setShareData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to create share link. Please ensure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = shareData
    ? `${window.location.origin}/s/${shareData.rawToken}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!shareData) return;
    setLoading(true);
    try {
      await api.share.revoke(shareData.id);
      setRevoked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-sand-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-stone-400 hover:bg-sand-100 hover:text-stone-700 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-plum-100 p-3 text-plum-700">
          <Share2 className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold text-stone-900">Secure Share Link</h2>
        <p className="mt-1 text-sm text-stone-500">
          Generate an expiring, read-only link for this appointment preparation summary.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {revoked ? (
          <div className="mt-6 rounded-xl bg-sand-100 p-4 text-center">
            <p className="text-sm font-semibold text-stone-800">Share Link Revoked</p>
            <p className="text-xs text-stone-500 mt-1">This link is no longer accessible to anyone.</p>
            <button
              onClick={() => { setShareData(null); setRevoked(false); }}
              className="mt-4 rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-plum-700"
            >
              Create New Link
            </button>
          </div>
        ) : shareData ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-xs text-stone-800 font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-plum-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-plum-700 shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2 rounded-xl bg-sand-50 p-2.5 border border-sand-200">
                <Clock className="h-4 w-4 text-plum-600" />
                <span>Expires: {new Date(shareData.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-sand-50 p-2.5 border border-sand-200">
                <Eye className="h-4 w-4 text-teal-600" />
                <span>Max views: {shareData.maxViews}</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Search engines are instructed not to index this page (<code>noindex, nofollow</code>). You can revoke access at any time.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRevoke}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoke Link Immediately
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Link Expiry
                </label>
                <select
                  value={expiryDays}
                  onChange={e => setExpiryDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-sand-300 bg-sand-50 p-2.5 text-sm text-stone-800 outline-none focus:border-plum-400 focus:bg-white"
                >
                  <option value={1}>24 hours</option>
                  <option value={7}>7 days (Default)</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (Max)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  View Limit
                </label>
                <select
                  value={maxViews}
                  onChange={e => setMaxViews(Number(e.target.value))}
                  className="w-full rounded-xl border border-sand-300 bg-sand-50 p-2.5 text-sm text-stone-800 outline-none focus:border-plum-400 focus:bg-white"
                >
                  <option value={1}>1 view only</option>
                  <option value={3}>3 views</option>
                  <option value={5}>5 views (Default)</option>
                  <option value={10}>10 views</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-stone-500">
              Only people with the secret link can view this summary. The token is cryptographically generated and hashed with SHA-256 on the server.
            </p>

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full rounded-xl bg-plum-600 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:opacity-50"
            >
              {loading ? 'Generating link...' : 'Create Secure Share Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
