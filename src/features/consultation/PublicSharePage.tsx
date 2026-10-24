import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Printer,
  Heart,
  Clock,
  Eye,
  AlertCircle,
  Calendar,
  LayoutGrid,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'quadrants' | 'narrative'>('quadrants');

  useEffect(() => {
    // Set noindex, nofollow for clinical privacy
    let metaTag = document.querySelector('meta[name="robots"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'robots');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', 'noindex, nofollow');

    return () => {
      metaTag?.setAttribute('content', 'index, follow');
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api.share.getPublic(token)
      .then(res => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'This link has expired, reached its maximum view limit, or has been revoked.');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg border border-sand-200">
          <p className="text-sm text-stone-700">Invalid share link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading secure consultation brief...</p>
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

  // Extract sections or answers for 4-quadrant rapid scanning
  const sections: any[] = summary.sections || [];
  const findSec = (keyPart: string) =>
    sections.find(s => s.id?.toLowerCase().includes(keyPart) || s.title?.toLowerCase().includes(keyPart))?.content;

  const rawText: string = summary.editedText || summary.generatedText || '';
  const extractBlock = (title: string): string => {
    const idx = rawText.indexOf(title);
    if (idx === -1) return '';
    const start = idx + title.length;
    const nextIdx = rawText.slice(start).search(/\n\n[A-Z\s]{4,}\n|\n═{5,}/);
    if (nextIdx !== -1) {
      return rawText.slice(start, start + nextIdx).trim();
    }
    return rawText.slice(start).trim();
  };

  const primaryConcerns = findSec('concern') || findSec('change') || extractBlock('RECENT CHANGES') || extractBlock('MAIN CONCERNS');
  const dailyImpact = findSec('impact') || extractBlock('IMPACT ON DAILY ACTIVITIES');
  const healthBackground = findSec('record') || findSec('background') || extractBlock('RECORDED HEALTH BACKGROUND') || extractBlock('RELEVANT MEDICINES & RECORDS');
  const questionsToAsk = findSec('question') || extractBlock('QUESTIONS TO ASK');
  const recordedSymptoms = extractBlock('RECORDED SYMPTOMS');

  return (
    <div className="min-h-screen bg-sand-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top brand header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" fill="currentColor" />
            </span>
            <div>
              <span className="text-sm font-bold text-stone-800">HerHealth Companion</span>
              <span className="ml-2 rounded-md bg-plum-100 px-2 py-0.5 text-[10px] font-semibold text-plum-800">
                Clinician Brief View
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-sand-200/80 p-0.5 border border-sand-300">
              <button
                type="button"
                onClick={() => setViewMode('quadrants')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  viewMode === 'quadrants' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                4-Quadrant Scan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('narrative')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  viewMode === 'narrative' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Full Text
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-sand-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="rounded-2xl border border-sand-300 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                CLINICAL ADVISORY & INFORMATION NOTICE
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-700">
                This summary was assembled by HerHealth Companion strictly from self-reported observations and journal check-ins.
                It is not a clinical assessment, medical directive, or clinical conclusion. It is provided solely to support efficient user-clinician consultation. If you are worried, speak to a health professional.
              </p>
            </div>
          </div>
        </div>

        {/* Header Metadata Card */}
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-stone-900">
                Consultation Brief & Timeline
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Organized self-reported history for 10-15 minute clinical consultation review.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5 text-plum-600" />
                {new Date(summary.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-2.5 py-1">
                <Eye className="h-3.5 w-3.5 text-teal-600" />
                {shareInfo.viewsRemaining} views left
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: 4-QUADRANT RAPID SCAN (FOR 10-15 MIN CONSULTATION)    */}
        {/* ============================================================ */}
        {viewMode === 'quadrants' ? (
          <div className="grid gap-5 md:grid-cols-2">
            {/* Quadrant 1: Primary Concerns & Timeline */}
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-sand-200 pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-plum-100 text-plum-700 font-bold text-xs">
                  1
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-plum-800">
                  Primary Concerns & Timing
                </h2>
              </div>
              <div className="text-xs text-stone-800 leading-relaxed space-y-2 whitespace-pre-line bg-sand-50/50 p-3 rounded-xl border border-sand-100">
                {primaryConcerns ? (
                  primaryConcerns
                ) : (
                  <span className="text-stone-400 italic">No specific primary concern entered.</span>
                )}
              </div>
              {recordedSymptoms && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Recorded Symptom Frequencies:
                  </span>
                  <div className="text-[11px] text-stone-700 whitespace-pre-line bg-white p-2.5 rounded-lg border border-sand-200">
                    {recordedSymptoms}
                  </div>
                </div>
              )}
            </div>

            {/* Quadrant 2: Daily Life Impact */}
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-sand-200 pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">
                  2
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  Daily Functional Impact
                </h2>
              </div>
              <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-sand-50/50 p-3 rounded-xl border border-sand-100">
                {dailyImpact ? (
                  dailyImpact
                ) : (
                  <span className="text-stone-400 italic">No functional daily impact recorded.</span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 italic">
                Evaluates interference with employment, sleep, cognitive focus, and physical movement.
              </p>
            </div>

            {/* Quadrant 3: Health Background & Medicines */}
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-sand-200 pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                  3
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Recorded Health Background
                </h2>
              </div>
              <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-sand-50/50 p-3 rounded-xl border border-sand-100">
                {healthBackground ? (
                  healthBackground
                ) : (
                  <span className="text-stone-400 italic">No previous medicines or clinical history recorded in summary.</span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 italic">
                Self-reported context markers. Verify all details directly with the individual.
              </p>
            </div>

            {/* Quadrant 4: Questions for Today */}
            <div className="rounded-2xl border-2 border-plum-300 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-sand-200 pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-700 font-bold text-xs">
                  4
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Priority Questions for Healthcare Professional
                </h2>
              </div>
              <div className="text-xs text-stone-900 font-medium leading-relaxed whitespace-pre-line bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                {questionsToAsk ? (
                  questionsToAsk
                ) : (
                  <span className="text-stone-400 italic">No explicit questions listed by user.</span>
                )}
              </div>
              <p className="text-[11px] text-rose-800 font-medium">
                The individual has highlighted these questions to discuss during today's visit.
              </p>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: FULL NARRATIVE DOCUMENT VIEW                         */
          /* ============================================================ */
          <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            {sections && sections.length > 0 ? (
              sections
                .filter((s: any) => s.id !== 'header' && s.id !== 'disclaimer' && s.id !== 'footer')
                .map((sec: any) => (
                  <div key={sec.id} className="space-y-1.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-plum-700">
                      {sec.title}
                    </h2>
                    <div className="text-xs sm:text-sm leading-relaxed text-stone-800 whitespace-pre-line bg-sand-50/50 p-3.5 rounded-xl border border-sand-100">
                      {sec.content}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-mono">
                {rawText}
              </div>
            )}
          </div>
        )}

        {/* Document Footer */}
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <span>Prepared with HerHealth Companion · Single-use consultation token</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              Expires: {new Date(shareInfo.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
