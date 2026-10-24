import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getAllEntries, deleteEntry } from '../../lib/db';
import { SEVERITY_LABELS, SEVERITY_COLORS, getEntryDate, getEntryTime, type SymptomEntry, type Severity } from '../../types/health';

export function JournalPage() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    const e = await getAllEntries();
    setEntries(e.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a))));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = entries.filter(e =>
    e.symptom.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
    getEntryDate(e).includes(search)
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteEntry(deleteId);
    setEntries(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
    setToast('Entry deleted');
    setTimeout(() => setToast(''), 3000);
  };

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <PageHeader
        title="Symptom Journal"
        description="Track and review your health experiences"
        action={
          <Link to="/journal/new" className="inline-flex items-center gap-2 bg-plum-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-plum-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Check-in
          </Link>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by symptom, date, or notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sm focus:ring-2 focus:ring-plum-300 focus:border-plum-400 outline-none"
          aria-label="Search entries"
        />
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading entries...</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-sand-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{search ? 'No matching entries' : 'No check-ins yet'}</h3>
          <p className="text-gray-400 text-sm mb-6">{search ? 'Try a different search term' : 'Start tracking your health experiences'}</p>
          {!search && (
            <Link to="/journal/new" className="inline-flex items-center gap-2 bg-plum-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-plum-700 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Add Your First Check-in
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(entry => (
          <div key={entry.id} className="bg-white border border-sand-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{entry.symptom}</span>
                  {entry.severity ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: SEVERITY_COLORS[entry.severity as Severity] }}
                    >
                      {SEVERITY_LABELS[entry.severity as Severity]}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sand-200 text-stone-500">
                      Severity: not recorded
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {fmt(getEntryDate(entry))}{getEntryTime(entry) ? ` at ${getEntryTime(entry)}` : ''}
                </div>
                {entry.dailyImpact && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{entry.dailyImpact}</p>}
                {entry.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{entry.notes}</p>}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  {entry.mood !== null && entry.mood !== undefined ? <span>Mood: {entry.mood}/5</span> : null}
                  {entry.energy !== null && entry.energy !== undefined ? <span>Energy: {entry.energy}/5</span> : null}
                  {entry.sleepQuality !== null && entry.sleepQuality !== undefined ? <span>Sleep: {entry.sleepQuality}/5</span> : null}
                  {entry.mood === null && entry.energy === null && entry.sleepQuality === null && (
                    <span className="italic text-stone-400">Wellbeing metrics: not recorded</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link to={`/journal/edit/${entry.id}`} className="p-2 text-gray-400 hover:text-plum-600 rounded-lg hover:bg-sand-100 transition-colors" aria-label="Edit entry">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => setDeleteId(entry.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" aria-label="Delete entry">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Check-in"
        message="This will permanently remove this entry. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
