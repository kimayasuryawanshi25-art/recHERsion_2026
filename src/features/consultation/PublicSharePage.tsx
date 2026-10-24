import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, Printer, Heart, Clock, Eye, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.share.getPublic(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'This link has expired, reached its maximum view limit, or has been revoked.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading secure summary...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg border border-sand-200">
          <div className="inline-flex items-center justify-center rounded-2xl bg-amber-100 p-3 text-amber-700 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-bold text-stone-900 mb-2">Link Unavailable</h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {error || 'This summary link is no longer accessible. It may have expired or reached its maximum view limit.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-plum-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
          >
            Learn about HerHealth Companion
          </Link>
        </div>
      </div>
    );
  }

  const { summary, shareInfo } = data;

  return (
    <div className="min-h-screen bg-sand-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top brand header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" fill="currentColor" />
            </span>
            <span className="text-sm font-bold text-stone-800">HerHealth Companion</span>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-sand-50"
          >
            <Printer className="h-4 w-4" />
            Print Summary
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="rounded-2xl border border-sand-300 bg-white p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                CLINICAL ADVISORY & INFORMATION NOTICE
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-700">
                This summary was prepared by HerHealth Companion from self-reported records. It is not a clinical assessment, medical diagnosis, or treatment plan. It is shared strictly to support patient-clinician discussion.
              </p>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="border-b border-sand-200 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              Appointment Preparation Summary
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Shared consultation document · Generated from self-reported check-ins
            </p>
          </div>

          {summary.sections && summary.sections.length > 0 ? (
            summary.sections
              .filter((s: any) => s.id !== 'header' && s.id !== 'disclaimer' && s.id !== 'footer')
              .map((sec: any) => (
                <div key={sec.id} className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-plum-700">
                    {sec.title}
                  </h2>
                  <div className="text-sm leading-relaxed text-stone-800 whitespace-pre-line bg-sand-50/50 p-3.5 rounded-xl border border-sand-100">
                    {sec.content}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
              {summary.editedText || summary.generatedText}
            </div>
          )}

          {/* Document Footer */}
          <div className="border-t border-sand-200 pt-5 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Prepared with HerHealth Companion</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-stone-400" />
                Views left: {shareInfo.viewsRemaining}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                Expires: {new Date(shareInfo.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
