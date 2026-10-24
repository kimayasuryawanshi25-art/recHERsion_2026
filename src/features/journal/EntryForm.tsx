import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, HeartHandshake, Mic } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  COMMON_SYMPTOMS, SEVERITY_LABELS, MOOD_LABELS, ENERGY_LABELS, SLEEP_LABELS,
  type SymptomEntry, type Severity, type HealthContextId
} from '../../types/health';
import { saveEntry, getEntry, deleteEntry, getSettings } from '../../lib/db';
import { detectCrisisLanguage } from '../../lib/safety/crisisKeywords';
import { VoiceDiaryModal } from './VoiceDiaryModal';

interface Props { editMode?: boolean; }

export function EntryForm({ editMode = false }: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [contexts, setContexts] = useState<HealthContextId[]>([]);

  const [form, setForm] = useState(() => ({
    date: new Date().toISOString().slice(0, 10),
    time: '',
    symptom: '',
    severity: '' as string,
    mood: '' as string,
    energy: '' as string,
    sleepQuality: '' as string,
    dailyImpact: '',
    notes: '',
    medications: '',
  }));


  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    if (field === 'symptom') {
      const v = value.toLowerCase();
      setSuggestions(v.length > 0 ? COMMON_SYMPTOMS.filter(s => s.toLowerCase().includes(v) && s.toLowerCase() !== v) : []);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.date) e.date = 'Date is required';
    if (!form.symptom.trim()) e.symptom = 'Symptom is required';
    if (form.severity && (isNaN(Number(form.severity)) || Number(form.severity) < 1 || Number(form.severity) > 5)) e.severity = 'Must be 1–5';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [existingRecord, setExistingRecord] = useState<SymptomEntry | null>(null);

  useEffect(() => {
    const init = async () => {
      const settings = await getSettings();
      if (settings) setContexts(settings.selectedContexts);
      if (editMode && id) {
        const entry = await getEntry(id);
        if (entry) {
          setExistingRecord(entry);
          setForm({
            date: entry.eventDate || entry.date || '',
            time: entry.eventTime || entry.time || '',
            symptom: entry.symptom,
            severity: entry.severity?.toString() || '',
            mood: entry.mood?.toString() || '',
            energy: entry.energy?.toString() || '',
            sleepQuality: entry.sleepQuality?.toString() || '',
            dailyImpact: entry.dailyImpact || '',
            notes: entry.notes || '',
            medications: entry.medications || '',
          });
          if (entry.dailyImpact || entry.notes || entry.medications || entry.mood || entry.energy || entry.sleepQuality) {
            setShowMore(true);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [editMode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const entry: SymptomEntry = {
      id: editMode && id ? id : uuidv4(),
      eventDate: form.date,
      eventTime: form.time ? form.time : null,
      date: form.date,
      time: form.time || undefined,
      symptom: form.symptom.trim(),
      severity: form.severity ? (Number(form.severity) as Severity) : null,
      mood: form.mood ? Number(form.mood) : null,
      energy: form.energy ? Number(form.energy) : null,
      sleepQuality: form.sleepQuality ? Number(form.sleepQuality) : null,
      dailyImpact: form.dailyImpact.trim() || null,
      notes: form.notes.trim() || null,
      medications: form.medications.trim() || null,
      contexts: contexts.length > 0 ? contexts : ['general-wellbeing'],
      recordedAt: existingRecord?.recordedAt || now,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };
    await saveEntry(entry);
    setSaving(false);
    navigate('/journal');
  };

  const handleDelete = async () => {
    if (id) { await deleteEntry(id); navigate('/journal'); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  const scaleButtons = (field: string, labels: Record<number, string>, value: string) => (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onClick={() => update(field, value === String(n) ? '' : String(n))}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            value === String(n) ? 'bg-plum-100 border-plum-400 text-plum-700' : 'bg-white border-sand-200 text-gray-500 hover:border-sand-300'
          }`}
          aria-label={`${labels[n]} (${n})`}
        >
          {n} — {labels[n]}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title={editMode ? 'Edit Check-in' : 'New Check-in'}
        action={
          <button onClick={() => navigate('/journal')} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 space-y-6 max-w-2xl">
        {/* Required fields */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-rose-500">*</span></label>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300 ${errors.date ? 'border-red-400' : 'border-sand-200'}`}
              aria-required="true"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-gray-400 text-xs">(optional)</span></label>
            <input type="time" value={form.time} onChange={e => update('time', e.target.value)}
              className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300"
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Symptom or Experience <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 hover:text-plum-800 transition"
              >
                <Mic className="h-3.5 w-3.5" />
                Voice Diary
              </button>
            </div>
            <input type="text" value={form.symptom} onChange={e => update('symptom', e.target.value)}
              placeholder="e.g., Headache, Fatigue, Hot flash"
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300 ${errors.symptom ? 'border-red-400' : 'border-sand-200'}`}
              aria-required="true"
              autoComplete="off"
            />
            {errors.symptom && <p className="text-red-500 text-xs mt-1">{errors.symptom}</p>}
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-sand-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map(s => (
                  <button key={s} type="button" onClick={() => { update('symptom', s); setSuggestions([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-sand-100 transition-colors"
                  >{s}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity <span className="text-gray-400 text-xs">(optional, 1–5 self-reported scale)</span></label>
            {scaleButtons('severity', SEVERITY_LABELS, form.severity)}
            {errors.severity && <p className="text-red-500 text-xs mt-1">{errors.severity}</p>}
          </div>
        </div>

        {/* Optional fields toggle */}
        {!showMore && (
          <button type="button" onClick={() => setShowMore(true)}
            className="text-plum-600 hover:text-plum-700 text-sm font-medium"
          >
            + Add mood, sleep, energy, impact & notes
          </button>
        )}

        {showMore && (
          <div className="space-y-4 border-t border-sand-100 pt-6">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">How You Feel</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
              {scaleButtons('mood', MOOD_LABELS, form.mood)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
              {scaleButtons('energy', ENERGY_LABELS, form.energy)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
              {scaleButtons('sleepQuality', SLEEP_LABELS, form.sleepQuality)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impact on Daily Activities <span className="text-gray-400 text-xs">(optional)</span></label>
              <textarea value={form.dailyImpact} onChange={e => update('dailyImpact', e.target.value)}
                rows={2} placeholder="How has this affected your daily life?"
                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 text-xs">(optional)</span></label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                rows={2} placeholder="Any additional details..."
                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300 resize-none"
              />
            </div>

            {(detectCrisisLanguage(form.notes) || detectCrisisLanguage(form.dailyImpact)) && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
                <HeartHandshake className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-950 mb-0.5">Compassionate support is available</p>
                  <p className="text-rose-800 leading-relaxed">
                    If you are feeling overwhelmed, distressed, or unsafe, free confidential Australian support is available right now:
                    <br />
                    • <strong>Lifeline:</strong> <a href="tel:131114" className="underline font-bold">13 11 14</a> (24/7 crisis support)
                    <br />
                    • <strong>1800RESPECT:</strong> <a href="tel:1800737732" className="underline font-bold">1800 737 732</a> (24/7 domestic & sexual violence)
                    <br />
                    • <strong>Emergency Services:</strong> <a href="tel:000" className="underline font-bold">000</a>
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medications <span className="text-gray-400 text-xs">(optional)</span></label>
              <input type="text" value={form.medications} onChange={e => update('medications', e.target.value)}
                placeholder="e.g., Took ibuprofen"
                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-plum-300"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-sand-100">
          
<button
  type="submit"
  disabled={saving}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/10 transition-all duration-200 hover:bg-[#493B72] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B72CF] disabled:cursor-not-allowed disabled:opacity-50"
>
  <Save className="h-4 w-4" />
  {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Save Check-in'}
</button>

          <button type="button" onClick={() => navigate('/journal')} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          {editMode && (
            <button type="button" onClick={() => setShowDelete(true)}
              className="ml-auto inline-flex items-center gap-2 text-red-500 hover:text-red-600 text-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </form>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Delete Check-in" message="This will permanently remove this entry." confirmLabel="Delete" variant="danger"
      />

      <VoiceDiaryModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onConfirmText={(spoken) => {
          if (!form.symptom.trim() && spoken.length < 40) {
            update('symptom', spoken);
          } else {
            if (!form.symptom.trim()) {
              update('symptom', spoken.slice(0, 30));
            }
            update('notes', form.notes ? `${form.notes}\n${spoken}` : spoken);
            setShowMore(true);
          }
        }}
      />
    </div>
  );
}
