import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { getAllEntries } from '../../lib/db';
import { type SymptomEntry, getEntryDate } from '../../types/health';
import { generateObservations } from '../../lib/observations';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

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

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="min-h-full rounded-3xl bg-gradient-to-br from-[#FAFAFF] via-white to-[#EDE7F6]/60 p-1">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Your health at a glance</p>
      </div>

      {/* Quick stats */}
      <ScrollReveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Check-ins', value: entries.length, icon: BookOpen, color: 'text-plum-600 bg-plum-50' },
          { label: 'Symptoms tracked', value: uniqueSymptoms.length, icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
          { label: 'Days covered', value: new Set(entries.map(e => getEntryDate(e)).filter(Boolean)).size, icon: Clock, color: 'text-rose-600 bg-rose-50' },
          { label: 'Date range', value: entries.length > 0 ? `${new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '—', icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm shadow-violet-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-gray-800">{typeof s.value === 'number' ? s.value : ''}</div>
            {typeof s.value === 'string' && <div className="text-sm font-medium text-gray-700">{s.value}</div>}
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>
      </ScrollReveal>
      {entries.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/75 p-8 text-center shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <BookOpen className="w-12 h-12 text-[#9B72CF] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No check-ins yet</h3>
          <p className="text-sm text-gray-600 text-sm mb-6">Start recording your health experiences to see your overview.</p>
          <Link to="/journal/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-900/15 transition hover:bg-[#493B72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B72CF]">
            <Plus className="w-4 h-4" /> Add Your First Check-in
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent entries */}
          <div className="rounded-2xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Check-ins</h2>
              <Link to="/journal" className="text-[#5B4B8A] hover:text-[#493B72] text-sm font-medium">View all →</Link>
            </div>
            <div className="space-y-3">
              {recentEntries.map(e => {
                const ed = getEntryDate(e);
                return (
                  <Link key={e.id} to={`/journal/edit/${e.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sand-50 transition-colors">
                    <div className="text-xs text-gray-400 w-16 shrink-0">
                      {ed ? new Date(ed + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{e.symptom}</span>
                      {e.severity && <span className="text-xs text-gray-400 ml-2">Severity {e.severity}/5</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick insights */}
          <div className="rounded-2xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Key Insights</h2>
              <Link to="/timeline" className="text-[#5B4B8A] hover:text-[#493B72] text-sm font-medium">View all →</Link>
            </div>
            {observations.length > 0 ? (
              <div className="space-y-3">
                {observations.map(obs => (
                  <div key={obs.id} className="rounded-xl border border-[#EDE7F6] bg-[#EDE7F6]/70 p-3">
                  <h4 className="text-sm font-medium text-[#5B4B8A]">{obs.title}</h4>
                   <p className="mt-1 line-clamp-2 text-xs text-[#5B4B8A]/80">{obs.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Add more check-ins to see insights.</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/journal/new" className="flex items-center gap-3 rounded-xl border border-[#d8cebf] bg-white p-4 transition-all duration-200 hover:border-[#92799a] hover:bg-[#f6f2f7]">
              <Plus className="w-5 h-5" />
              <div><div className="flex items-center gap-3 rounded-xl border border-[#EDE7F6] bg-white p-4 text-[#5B4B8A] transition-all duration-200 hover:border-[#9B72CF] hover:bg-[#EDE7F6]/60">New Check-in</div><div className="text-xs text-gray-500">Record a health experience</div></div>
            </Link>
            <Link to="/timeline" className="flex items-center gap-3 bg-white border border-sand-200 rounded-xl p-4 hover:bg-sand-50 transition-colors">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <div><div className="flex items-center gap-3 rounded-xl border border-[#EDE7F6] bg-white p-4 transition-colors hover:bg-[#EDE7F6]/50">View Charts</div><div className="text-xs text-gray-400">Explore your data</div></div>
            </Link>
            <Link to="/consultation" className="flex items-center gap-3 bg-white border border-sand-200 rounded-xl p-4 hover:bg-sand-50 transition-colors">
              <FileText className="w-5 h-5 text-rose-500" />
              <div><div className="font-medium text-sm text-gray-700">Prepare for Visit</div><div className="text-xs text-gray-400">Create appointment summary</div></div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
