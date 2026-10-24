import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, FileText, TrendingUp, BarChart3, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { getAllEntries } from '../../lib/db';
import { type SymptomEntry, getEntryDate, SEVERITY_COLORS} from '../../types/health';
import { generateObservations } from '../../lib/observations';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { GentleWellnessIllustration, EmptyRecordsIllustration } from '../../components/ui/Illustrations';

export function OverviewPage() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const e = await getAllEntries();
      setEntries(e.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a))));
      setLoading(false);
    })();
  }, []);

  const recentEntries = entries.slice(0, 5);
  const uniqueSymptoms = [...new Set(entries.map(e => e.symptom))];
  const dates = entries.map(e => getEntryDate(e)).filter(Boolean).sort();
  const start = dates[0] || '';
  const end = dates[dates.length - 1] || '';
  const observations = entries.length >= 2 ? generateObservations(entries, start, end).slice(0, 3) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-plum-200 border-t-plum-600" />
        <p className="text-xs font-medium">Loading your health overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner with Illustration */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-sand-200/90 bg-gradient-to-br from-white via-plum-50/40 to-[#EDE7F6]/50 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-plum-200/80 px-3 py-1 text-xs font-bold text-plum-700 shadow-xs">
                <Heart className="h-3.5 w-3.5 text-rose-500" fill="currentColor" />
                Personal Health Space
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
                Welcome to HerHealth
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Track your symptoms at your own pace, notice patterns without guesswork, and turn scattered notes into clear, clinician-ready summaries.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link
                  to="/journal/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-purple-800"
                >
                  <Plus className="h-4 w-4" />
                  Log Check-in
                </Link>

                <Link
                  to="/consultation"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-sand-300 px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-sand-50 transition shadow-xs"
                >
                  <FileText className="h-4 w-4 text-plum-600" />
                  Prepare Doctor Summary
                </Link>
              </div>
            </div>

            <div className="shrink-0 drop-shadow-sm">
              <GentleWellnessIllustration className="w-36 h-36 sm:w-44 sm:h-44" />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Metrics Row */}
      <ScrollReveal delay={100}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Check-ins', value: entries.length, icon: BookOpen, color: 'text-plum-600 bg-plum-50' },
            { label: 'Unique Symptoms', value: uniqueSymptoms.length, icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
            { label: 'Active Days Logged', value: new Set(dates).size, icon: Clock, color: 'text-rose-600 bg-rose-50' },
            {
              label: 'Timeline Span',
              value: entries.length > 0
                ? `${new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : '—',
              icon: BarChart3,
              color: 'text-amber-600 bg-amber-50',
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl border border-sand-200/90 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-stone-900">{typeof s.value === 'number' ? s.value : ''}</div>
              {typeof s.value === 'string' && <div className="text-xs font-bold text-stone-800 truncate">{s.value}</div>}
              <div className="text-[11px] text-stone-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Main Content Grid */}
      {entries.length === 0 ? (
        <ScrollReveal delay={200}>
          <div className="rounded-3xl border border-sand-200 bg-white/80 p-10 text-center shadow-sm backdrop-blur-xl space-y-4">
            <EmptyRecordsIllustration className="mx-auto" />
            <h3 className="text-lg font-bold text-stone-800">Your health story starts here</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Start by recording your first symptom or daily experience. Even a short 15-second entry builds a timeline you can take to your doctor.
            </p>
            <div className="pt-2">
              <Link
                to="/journal/new"
                className="inline-flex items-center gap-2 rounded-xl bg-plum-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-plum-900/15 hover:bg-plum-700 transition"
              >
                <Plus className="h-4 w-4" /> Record First Check-in
              </Link>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Entries Card */}
          <ScrollReveal delay={150}>
            <div className="rounded-3xl border border-sand-200/90 bg-white/85 p-6 shadow-sm backdrop-blur-xl flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-sand-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-plum-600" />
                  <h2 className="font-bold text-stone-900 text-sm">Recent Check-ins</h2>
                </div>
                <Link to="/journal" className="text-xs font-bold text-plum-600 hover:text-plum-700 flex items-center gap-1">
                  View all journal <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-sand-100 flex-1 py-1">
                {recentEntries.map(e => {
                  const ed = getEntryDate(e);
                  return (
                    <Link
                      key={e.id}
                      to={`/journal/edit/${e.id}`}
                      className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-sand-50/80 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-center w-11 shrink-0 rounded-lg bg-sand-100/70 py-1">
                          <span className="block text-[10px] font-bold uppercase text-stone-400">
                            {ed ? new Date(ed + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '—'}
                          </span>
                          <span className="block text-sm font-bold text-stone-800 leading-none">
                            {ed ? new Date(ed + 'T00:00:00').getDate() : '—'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-stone-800 group-hover:text-plum-700 transition block truncate">
                            {e.symptom}
                          </span>
                          {e.notes && (
                            <span className="text-[11px] text-stone-400 block truncate">"{e.notes}"</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {e.severity && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: SEVERITY_COLORS[e.severity] }}
                          >
                            Severity {e.severity}
                          </span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-plum-600 transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-sand-100 text-center">
                <Link
                  to="/journal/new"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 hover:text-plum-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another check-in
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Key Observations Card */}
          <ScrollReveal delay={200}>
            <div className="rounded-3xl border border-sand-200/90 bg-white/85 p-6 shadow-sm backdrop-blur-xl flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-sand-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  <h2 className="font-bold text-stone-900 text-sm">Key Observations</h2>
                </div>
                <Link to="/timeline" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
                  Full trends <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3 flex-1 py-3">
                {observations.length > 0 ? (
                  observations.map(obs => (
                    <div
                      key={obs.id}
                      className="rounded-2xl border border-sand-200/80 bg-gradient-to-br from-white to-sand-50/50 p-3.5 transition hover:border-plum-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-900">{obs.title}</span>
                        <span className="text-[10px] text-stone-400 font-medium">{obs.entryCount} records</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{obs.description}</p>
                      <div className="mt-2 text-[10px] text-stone-400 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-teal-600" />
                        <span>Descriptive rule • Not a clinical verdict</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    Record a few more check-ins to reveal transparent, evidence-linked patterns.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-sand-100">
                <Link
                  to="/consultation"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-plum-50 hover:bg-plum-100/80 p-2 text-xs font-bold text-plum-700 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-plum-600" />
                  Extract consultation summary with AI →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
