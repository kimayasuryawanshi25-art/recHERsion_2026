import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, Legend, Cell,
} from 'recharts';
import { Calendar, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Eye, CalendarX2, Pill, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getAllEntries, getMedicineEvents, getLifeEvents } from '../../lib/db';
import { generateObservations } from '../../lib/observations';
import {
  SEVERITY_COLORS, SEVERITY_LABELS, getEntryDate,
  type SymptomEntry, type Severity,
} from '../../types/health';

const CHART_COLORS = ['#a855f7', '#f43f5e', '#14b8a6', '#f97316', '#3b82f6', '#84cc16', '#eab308', '#6366f1'];

export function TimelinePage() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [medicineEvents, setMedicineEvents] = useState<any[]>([]);
  const [lifeEvents, setLifeEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [symptomFilter, setSymptomFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedObs, setExpandedObs] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'charts' | 'insights'>('timeline');

  useEffect(() => {
    (async () => {
      const [e, meds, life] = await Promise.all([
        getAllEntries(),
        getMedicineEvents(),
        getLifeEvents(),
      ]);
      setEntries(e.sort((a, b) => getEntryDate(a).localeCompare(getEntryDate(b))));
      setMedicineEvents(meds);
      setLifeEvents(life);
      if (e.length > 0) {
        const dates = e.map(x => getEntryDate(x)).filter(Boolean).sort();
        setStartDate(dates[0] || '');
        setEndDate(dates[dates.length - 1] || '');
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let f = entries;
    if (startDate) f = f.filter(e => getEntryDate(e) >= startDate);
    if (endDate) f = f.filter(e => getEntryDate(e) <= endDate);
    if (symptomFilter) f = f.filter(e => e.symptom === symptomFilter);
    return f;
  }, [entries, startDate, endDate, symptomFilter]);

  const symptoms = useMemo(() => [...new Set(entries.map(e => e.symptom))].sort(), [entries]);

  // Chart data
  const freqData = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(e => { c[e.symptom] = (c[e.symptom] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, count], i) => ({
      name, count, fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [filtered]);

  const sevData = useMemo(() => {
    const byDate: Record<string, { date: string; [k: string]: number | string }> = {};
    filtered.filter(e => e.severity).forEach(e => {
      const d = getEntryDate(e);
      if (!d) return;
      if (!byDate[d]) byDate[d] = { date: d };
      byDate[d][e.symptom] = e.severity!;
    });
    return Object.values(byDate).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }, [filtered]);

  const wellbeingData = useMemo(() => {
    const byDate: Record<string, any> = {};
    filtered.forEach(e => {
      const d = getEntryDate(e);
      if (!d) return;
      if (!byDate[d]) byDate[d] = { date: d };
      if (e.sleepQuality) byDate[d].sleep = e.sleepQuality;
      if (e.mood) byDate[d].mood = e.mood;
      if (e.energy) byDate[d].energy = e.energy;
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [filtered]);

  const impactData = useMemo(() => {
    const hasImpact = filtered.filter(e => e.dailyImpact && e.dailyImpact.trim());
    const noImpact = filtered.length - hasImpact.length;
    return [
      { name: 'Impact recorded', count: hasImpact.length, fill: '#f43f5e' },
      { name: 'No impact noted', count: noImpact, fill: '#d1d5db' },
    ];
  }, [filtered]);

  // Observations
  const observations = useMemo(() => {
    if (!startDate || !endDate || filtered.length === 0) return [];
    return generateObservations(entries, startDate, endDate);
  }, [entries, startDate, endDate, filtered.length]);

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  if (entries.length === 0) return (
    <div>
      <PageHeader title="Timeline & Insights" description="Explore your health records" />
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-sand-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No entries yet</h3>
        <p className="text-gray-400 text-sm mb-4">Add some check-ins to see your timeline and insights.</p>
        <Link to="/journal/new" className="inline-flex items-center gap-2 bg-plum-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-plum-700 text-sm">Add Check-in</Link>
      </div>
    </div>
  );

  const tabs = [
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'charts' as const, label: 'Charts' },
    { id: 'insights' as const, label: 'Insights' },
  ];

  return (
    <div>
      <PageHeader title="Timeline & Insights" description="Explore your health records and patterns" />

      {/* Filters */}
      <div className="bg-white border border-sand-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-sand-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-sand-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Symptom</label>
          <select value={symptomFilter} onChange={e => setSymptomFilter(e.target.value)}
            className="px-3 py-1.5 border border-sand-200 rounded-lg text-sm bg-white">
            <option value="">All symptoms</option>
            {symptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(symptomFilter || startDate || endDate) && (
          <button onClick={() => { setSymptomFilter(''); const dates = entries.map(x => getEntryDate(x)).filter(Boolean).sort(); setStartDate(dates[0] || ''); setEndDate(dates[dates.length - 1] || ''); }}
            className="text-plum-600 hover:text-plum-700 text-sm font-medium pb-0.5">Clear filters</button>
        )}
        <div className="text-xs text-gray-400 ml-auto">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-sand-100 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-plum-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {(() => {
            const timelineItems: Array<{
              id: string;
              date: string;
              type: 'symptom' | 'medicine' | 'life_event';
              data: any;
            }> = [];

            filtered.forEach(entry => {
              const d = getEntryDate(entry);
              if (d) timelineItems.push({ id: `symptom-${entry.id}`, date: d, type: 'symptom', data: entry });
            });

            if (!symptomFilter) {
              medicineEvents.forEach(med => {
                const d = med.startedOn || med.stoppedOn || med.createdAt?.slice(0, 10);
                if (!d) return;
                if (startDate && d < startDate) return;
                if (endDate && d > endDate) return;
                timelineItems.push({ id: `med-${med.id}`, date: d, type: 'medicine', data: med });
              });

              lifeEvents.forEach(ev => {
                const d = ev.startDate || ev.endDate || ev.createdAt?.slice(0, 10);
                if (!d) return;
                if (startDate && d < startDate) return;
                if (endDate && d > endDate) return;
                timelineItems.push({ id: `life-${ev.id}`, date: d, type: 'life_event', data: ev });
              });
            }

            const sorted = timelineItems.sort((a, b) => b.date.localeCompare(a.date));
            const symptomOnly = sorted.filter(item => item.type === 'symptom');

            return sorted.map(item => {
              const dateObj = new Date((item.date || '1970-01-01') + 'T00:00:00');

              if (item.type === 'medicine') {
                const med = item.data;
                return (
                  <div key={item.id} className="bg-plum-50/50 border border-plum-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-xs text-plum-500 font-medium">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-xl font-bold text-plum-900">{dateObj.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill className="h-4 w-4 text-plum-600 shrink-0" />
                        <span className="font-semibold text-stone-800 text-sm">
                          {med.stoppedOn ? `Stopped: ${med.name}` : `Recorded medicine: ${med.name}`}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-plum-100 text-plum-800">
                          Context marker — recorded by you
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        {med.dose ? `Dose: ${med.dose}` : null}
                        {med.frequency ? ` • Frequency: ${med.frequency}` : null}
                        {med.reason ? ` • For: ${med.reason}` : null}
                      </p>
                      {med.notes && <p className="text-xs text-stone-500 italic mt-0.5">{med.notes}</p>}
                    </div>
                  </div>
                );
              }

              if (item.type === 'life_event') {
                const ev = item.data;
                return (
                  <div key={item.id} className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-xs text-amber-700 font-medium">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-xl font-bold text-amber-900">{dateObj.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-stone-800 text-sm">{ev.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                          Life context — recorded by you
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 capitalize">
                        Category: {ev.category ? ev.category.replace('_', ' ') : 'General'}
                      </p>
                      {ev.notes && <p className="text-xs text-stone-500 italic mt-0.5">{ev.notes}</p>}
                    </div>
                  </div>
                );
              }

              // Symptom entry
              const entry = item.data;
              const symIndex = symptomOnly.findIndex(s => s.id === item.id);
              let gapDays = 0;
              let nextDateStr = '';
              if (symIndex >= 0 && symIndex < symptomOnly.length - 1) {
                const nextSym = symptomOnly[symIndex + 1];
                const tCurrent = new Date(item.date + 'T00:00:00').getTime();
                const tNext = new Date(nextSym.date + 'T00:00:00').getTime();
                gapDays = Math.round((tCurrent - tNext) / (1000 * 60 * 60 * 24));
                nextDateStr = nextSym.date;
              }

              return (
                <div key={item.id}>
                  <div className="bg-white border border-sand-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-xs text-gray-400">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-xl font-bold text-gray-700">{dateObj.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{entry.symptom}</span>
                        {entry.severity ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: SEVERITY_COLORS[entry.severity as Severity] }}>
                            {SEVERITY_LABELS[entry.severity as Severity]}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sand-200 text-stone-500">
                            Severity: not recorded
                          </span>
                        )}
                      </div>
                      {entry.dailyImpact ? (
                        <p className="text-xs text-gray-500 mt-1">{entry.dailyImpact}</p>
                      ) : null}
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        {entry.mood !== null && entry.mood !== undefined ? <span>Mood {entry.mood}/5</span> : null}
                        {entry.sleepQuality !== null && entry.sleepQuality !== undefined ? <span>Sleep {entry.sleepQuality}/5</span> : null}
                        {entry.energy !== null && entry.energy !== undefined ? <span>Energy {entry.energy}/5</span> : null}
                        {entry.mood === null && entry.sleepQuality === null && entry.energy === null && (
                          <span className="italic text-stone-400">Wellbeing metrics: not recorded</span>
                        )}
                      </div>
                    </div>
                    <Link to={`/journal/edit/${entry.id}`} className="p-1.5 text-gray-400 hover:text-plum-600 rounded-lg hover:bg-sand-100 shrink-0" aria-label="View entry">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>

                  {gapDays > 14 && (
                    <div className="my-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-sand-300 bg-sand-100/50 text-xs text-stone-500">
                      <CalendarX2 className="h-4 w-4 text-stone-400 shrink-0" />
                      <span>
                        <strong>{gapDays} days without recorded check-ins</strong> (between {nextDateStr} and {item.date})
                      </span>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Charts */}
      {activeTab === 'charts' && (
        <div className="space-y-8">
          {/* Symptom frequency */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Symptom Frequency</h3>
            <p className="text-xs text-gray-400 mb-4">Number of times each symptom was recorded during the selected period. Counts represent recorded mentions.</p>
            {freqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={freqData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value ?? 0} entries`,'Count',]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {freqData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-8">No data for the selected period.</p>}
          </div>

          {/* Severity trend */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Self-Reported Severity Over Time</h3>
            <p className="text-xs text-gray-400 mb-4">Your recorded severity values (1–5 scale). Gaps indicate dates without severity data — they are not filled with zero.</p>
            {sevData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sevData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(label) =>label == null ? '' : fmt(String(label))} />
                  <Legend />
                  {symptoms.filter(s => !symptomFilter || s === symptomFilter).slice(0, 5).map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-8">No severity data for the selected period.</p>}
          </div>

          {/* Wellbeing trends */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Sleep, Mood & Energy Trends</h3>
            <p className="text-xs text-gray-400 mb-4">Each measure displayed separately on a 1–5 scale. Not combined into a single score.</p>
            {wellbeingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={wellbeingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                 <Tooltip labelFormatter={(label) =>label == null ? '' : fmt(String(label))} />
                  <Legend />
                  <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Sleep" />
                  <Line type="monotone" dataKey="mood" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Mood" />
                  <Line type="monotone" dataKey="energy" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Energy" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-8">No wellbeing data for the selected period.</p>}
          </div>

          {/* Impact summary */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Daily Life Impact</h3>
            <p className="text-xs text-gray-400 mb-4">How many entries included information about impact on daily activities.</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={impactData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {impactData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>About these insights:</strong> These are descriptive summaries calculated from your recorded entries using simple counting rules. They are not diagnoses, predictions, or medical assessments. Discuss any health concerns with your healthcare professional.
            </p>
          </div>

          {observations.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-sand-300 mx-auto mb-3" />
              <p className="text-gray-500">Not enough data to generate insights for this period.</p>
            </div>
          ) : (
            observations.map(obs => (
              <div key={obs.id} className="bg-white border border-sand-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedObs(expandedObs === obs.id ? null : obs.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-sand-50 transition-colors">
                  <AlertCircle className="w-5 h-5 text-plum-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">{obs.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{obs.description}</p>
                  </div>
                  {expandedObs === obs.id ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {expandedObs === obs.id && (
                  <div className="px-4 pb-4 border-t border-sand-100 pt-3 ml-8 space-y-2">
                    <p className="text-xs text-gray-500"><strong>Period:</strong> {obs.dateRange}</p>
                    <p className="text-xs text-gray-500"><strong>Based on:</strong> {obs.entryCount} entries</p>
                    <p className="text-xs text-gray-500"><strong>Limitations:</strong> {obs.limitations}</p>
                    <p className="text-xs text-gray-500"><strong>Supporting entries:</strong> {obs.supportingEntryIds.length} records</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
