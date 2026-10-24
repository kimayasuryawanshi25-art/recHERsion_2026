import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  getAllProfileSections,
  saveProfileSection,
  getHealthItems,
  saveHealthItem,
  deleteHealthItem,
  getMedicineEvents,
  saveMedicineEvent,
  deleteMedicineEvent,
  getLifeEvents,
  saveLifeEvent,
  deleteLifeEvent,
  getCareTeam,
  saveCareTeamMember,
  deleteCareTeamMember,
} from '../../lib/db';
import {
  ABOUT_ME_SECTION_KEYS,
  ABOUT_ME_SECTION_METADATA,
  countAddedProfileSections,
  type AboutMeSectionKey,
  type HealthItem,
  type MedicineEvent,
  type LifeEvent,
  type CareTeamMember,
} from '@rechersion/shared';

export function AboutMePage() {
  const [sections, setSections] = useState<Record<string, any>>({});
  const [healthItems, setHealthItems] = useState<HealthItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineEvent[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // UI modes: 'overview' or 'conversational'
  const [mode, setMode] = useState<'overview' | 'conversational'>('overview');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<AboutMeSectionKey | null>('basics');
  const [toastMessage, setToastMessage] = useState('');

  // Modals / forms for child lists
  const [showAddHealthItem, setShowAddHealthItem] = useState(false);
  const [newHealthItem, setNewHealthItem] = useState({
    kind: 'condition' as const,
    label: '',
    detail: '',
    status: 'known' as const,
    recordedDate: '',
    includeInSummary: true,
  });

  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dose: '',
    frequency: '',
    startDate: '',
    stopDate: '',
    reason: '',
    prescriber: '',
    status: 'active' as const,
    includeInSummary: true,
  });

  const [showAddLifeEvent, setShowAddLifeEvent] = useState(false);
  const [newLifeEvent, setNewLifeEvent] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'other' as const,
    notes: '',
    includeInSummary: true,
  });

  const [showAddCareTeam, setShowAddCareTeam] = useState(false);
  const [newCareMember, setNewCareMember] = useState({
    name: '',
    role: 'gp' as const,
    clinic: '',
    phone: '',
    email: '',
    notes: '',
    includeInSummary: true,
  });

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [secs, items, meds, events, team] = await Promise.all([
        getAllProfileSections(),
        getHealthItems(),
        getMedicineEvents(),
        getLifeEvents(),
        getCareTeam(),
      ]);
      setSections(secs || {});
      setHealthItems(items || []);
      setMedicines(meds || []);
      setLifeEvents(events || []);
      setCareTeam(team || []);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSectionField = async (sectionKey: AboutMeSectionKey, field: string, val: any) => {
    const currentSectionData = sections[sectionKey] || {};
    const updated = { ...currentSectionData, [field]: val };
    const nextSections = { ...sections, [sectionKey]: updated };
    setSections(nextSections);
    await saveProfileSection(sectionKey, updated);
  };

  // Health Item actions
  const handleSaveHealthItem = async () => {
    if (!newHealthItem.label.trim()) return;
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: HealthItem = {
      id,
      kind: newHealthItem.kind,
      label: newHealthItem.label.trim(),
      detail: newHealthItem.detail.trim() || null,
      status: newHealthItem.status,
      recordedDate: newHealthItem.recordedDate || null,
      stoppedDate: null,
      includeInSummary: newHealthItem.includeInSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveHealthItem(record);
    setHealthItems(prev => [...prev, record]);
    setShowAddHealthItem(false);
    setNewHealthItem({ kind: 'condition', label: '', detail: '', status: 'known', recordedDate: '', includeInSummary: true });
    notify('Health item saved.');
  };

  const handleDeleteHealthItem = async (id: string) => {
    await deleteHealthItem(id);
    setHealthItems(prev => prev.filter(i => i.id !== id));
    notify('Item removed.');
  };

  const handleToggleHealthItemSummary = async (item: HealthItem) => {
    const updated = { ...item, includeInSummary: !item.includeInSummary };
    await saveHealthItem(updated);
    setHealthItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
  };

  // Medicine actions
  const handleSaveMedicine = async () => {
    if (!newMedicine.name.trim()) return;
    const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: MedicineEvent = {
      id,
      name: newMedicine.name.trim(),
      dose: newMedicine.dose.trim() || null,
      frequency: newMedicine.frequency.trim() || null,
      startDate: newMedicine.startDate || null,
      stopDate: newMedicine.stopDate || null,
      reason: newMedicine.reason.trim() || null,
      prescriber: newMedicine.prescriber.trim() || null,
      status: newMedicine.status,
      includeInSummary: newMedicine.includeInSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveMedicineEvent(record);
    setMedicines(prev => [...prev, record]);
    setShowAddMedicine(false);
    setNewMedicine({ name: '', dose: '', frequency: '', startDate: '', stopDate: '', reason: '', prescriber: '', status: 'active', includeInSummary: true });
    notify('Medicine saved.');
  };

  const handleDeleteMedicine = async (id: string) => {
    await deleteMedicineEvent(id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    notify('Medicine removed.');
  };

  const handleToggleMedicineSummary = async (med: MedicineEvent) => {
    const updated = { ...med, includeInSummary: !med.includeInSummary };
    await saveMedicineEvent(updated);
    setMedicines(prev => prev.map(m => (m.id === med.id ? updated : m)));
  };

  // Life Event actions
  const handleSaveLifeEvent = async () => {
    if (!newLifeEvent.title.trim()) return;
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: LifeEvent = {
      id,
      title: newLifeEvent.title.trim(),
      date: newLifeEvent.date,
      category: newLifeEvent.category,
      notes: newLifeEvent.notes.trim() || null,
      includeInSummary: newLifeEvent.includeInSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveLifeEvent(record);
    setLifeEvents(prev => [...prev, record]);
    setShowAddLifeEvent(false);
    setNewLifeEvent({ title: '', date: new Date().toISOString().slice(0, 10), category: 'other', notes: '', includeInSummary: true });
    notify('Life event saved.');
  };

  const handleDeleteLifeEvent = async (id: string) => {
    await deleteLifeEvent(id);
    setLifeEvents(prev => prev.filter(e => e.id !== id));
    notify('Event removed.');
  };

  // Care Team actions
  const handleSaveCareTeam = async () => {
    if (!newCareMember.name.trim()) return;
    const id = `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CareTeamMember = {
      id,
      name: newCareMember.name.trim(),
      role: newCareMember.role,
      clinic: newCareMember.clinic.trim() || null,
      phone: newCareMember.phone.trim() || null,
      email: newCareMember.email.trim() || null,
      notes: newCareMember.notes.trim() || null,
      includeInSummary: newCareMember.includeInSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveCareTeamMember(record);
    setCareTeam(prev => [...prev, record]);
    setShowAddCareTeam(false);
    setNewCareMember({ name: '', role: 'gp', clinic: '', phone: '', email: '', notes: '', includeInSummary: true });
    notify('Care team member saved.');
  };

  const handleDeleteCareTeam = async (id: string) => {
    await deleteCareTeamMember(id);
    setCareTeam(prev => prev.filter(m => m.id !== id));
    notify('Care team member removed.');
  };

  const addedCount = countAddedProfileSections(sections);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-600 border-t-transparent" />
      </div>
    );
  }

  const currentSectionKey = ABOUT_ME_SECTION_KEYS[currentStepIndex];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <PageHeader
        title="About Me"
        description="A living, personal health profile. You decide what to share, and everything remains completely optional."
      />

      {toastMessage && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-800">
          {toastMessage}
        </div>
      )}

      {/* Gentle Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-plum-100 text-plum-700 font-bold text-xs">
              {addedCount}/10
            </span>
            <span className="text-sm font-semibold text-stone-800">
              {addedCount} of 10 profile sections added
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Fill as much or as little as you like. Profile context is never used to predict risks or diagnose you.
          </p>
        </div>

        <div className="flex rounded-xl bg-sand-100 p-1">
          <button
            type="button"
            onClick={() => setMode('overview')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              mode === 'overview' ? 'bg-white text-plum-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Sections
          </button>
          <button
            type="button"
            onClick={() => setMode('conversational')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              mode === 'conversational' ? 'bg-white text-plum-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Step-by-Step
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: STEP-BY-STEP CONVERSATIONAL MODE */}
      {/* ========================================================================= */}
      {mode === 'conversational' && (
        <div className="rounded-3xl border border-sand-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between text-xs text-stone-400">
            <span>Question {currentStepIndex + 1} of 10</span>
            <span className="font-semibold text-plum-700">
              {ABOUT_ME_SECTION_METADATA[currentSectionKey].title}
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-stone-900">
              {ABOUT_ME_SECTION_METADATA[currentSectionKey].prompt}
            </h2>
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-sand-50 p-3 text-xs text-stone-600">
              <HelpCircle className="h-4 w-4 shrink-0 text-plum-500 mt-0.5" />
              <span>
                <strong>Why we ask:</strong> {ABOUT_ME_SECTION_METADATA[currentSectionKey].whyWeAsk}
              </span>
            </div>
          </div>

          {/* Render Active Step Form */}
          <div className="my-6">
            {renderSectionContent(currentSectionKey)}
          </div>

          <div className="flex items-center justify-between border-t border-sand-200 pt-5">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-sand-50 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentStepIndex < ABOUT_ME_SECTION_KEYS.length - 1) {
                  setCurrentStepIndex(prev => prev + 1);
                } else {
                  setMode('overview');
                  notify('Profile questions completed.');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip for now
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentStepIndex < ABOUT_ME_SECTION_KEYS.length - 1) {
                  setCurrentStepIndex(prev => prev + 1);
                } else {
                  setMode('overview');
                  notify('Profile saved.');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white hover:bg-plum-700"
            >
              Next Section
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: OVERVIEW MODE (ALL 10 SECTIONS EXPANDABLE) */}
      {/* ========================================================================= */}
      {mode === 'overview' && (
        <div className="space-y-4">
          {ABOUT_ME_SECTION_KEYS.map((key, index) => {
            const meta = ABOUT_ME_SECTION_METADATA[key];
            const isExpanded = expandedSection === key;
            const hasData = sections[key] && Object.values(sections[key]).some(v => v !== null && v !== undefined && v !== '');

            return (
              <div
                key={key}
                className="rounded-2xl border border-sand-200 bg-white shadow-sm transition overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(isExpanded ? null : key)}
                  className="flex w-full items-center justify-between p-5 text-left hover:bg-sand-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sand-100 text-xs font-bold text-stone-700">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-stone-800 text-sm sm:text-base">
                        {meta.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {meta.whyWeAsk}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasData && (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Recorded
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-sand-100 bg-sand-50/30 p-5 sm:p-6">
                    <div className="mb-4 flex items-start gap-2 text-xs text-stone-500">
                      <HelpCircle className="h-3.5 w-3.5 text-plum-500 mt-0.5 shrink-0" />
                      <span>{meta.whyWeAsk}</span>
                    </div>

                    {renderSectionContent(key)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* Helper to render content for each section */
  function renderSectionContent(key: AboutMeSectionKey) {
    const data = sections[key] || {};

    switch (key) {
      case 'basics':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Preferred Name</label>
              <input
                type="text"
                value={data.preferredName || ''}
                onChange={e => handleUpdateSectionField('basics', 'preferredName', e.target.value)}
                placeholder="How you'd like to be called"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Pronouns</label>
              <input
                type="text"
                value={data.pronouns || ''}
                onChange={e => handleUpdateSectionField('basics', 'pronouns', e.target.value)}
                placeholder="e.g. she/her, they/them"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={data.dateOfBirth || ''}
                onChange={e => handleUpdateSectionField('basics', 'dateOfBirth', e.target.value)}
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Preferred Language</label>
              <input
                type="text"
                value={data.preferredLanguage || ''}
                onChange={e => handleUpdateSectionField('basics', 'preferredLanguage', e.target.value)}
                placeholder="e.g. English, Hindi, Marathi"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>
          </div>
        );

      case 'health_background':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Conditions, Surgeries, Allergies & Vaccines</span>
              <button
                type="button"
                onClick={() => setShowAddHealthItem(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            {/* List Existing Items */}
            {healthItems.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No health items recorded yet.</p>
            ) : (
              <div className="divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
                {healthItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">{item.label}</span>
                      <span className="ml-2 rounded bg-sand-100 px-1.5 py-0.5 text-[10px] uppercase font-bold text-stone-600">
                        {item.kind}
                      </span>
                      {item.detail && <p className="text-stone-500 mt-0.5">{item.detail}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-stone-500">
                        <input
                          type="checkbox"
                          checked={item.includeInSummary}
                          onChange={() => handleToggleHealthItemSummary(item)}
                          className="rounded text-plum-600 focus:ring-plum-500"
                        />
                        <span className="text-[11px]">Include in Summary</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteHealthItem(item.id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal / Inline Add Form */}
            {showAddHealthItem && (
              <div className="rounded-xl border border-plum-200 bg-plum-50/40 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Type</label>
                    <select
                      value={newHealthItem.kind}
                      onChange={e => setNewHealthItem({ ...newHealthItem, kind: e.target.value as any })}
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    >
                      <option value="condition">Diagnosed Condition</option>
                      <option value="surgery">Surgery / Procedure</option>
                      <option value="allergy">Allergy</option>
                      <option value="vaccination">Vaccination</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Name / Label</label>
                    <input
                      type="text"
                      value={newHealthItem.label}
                      onChange={e => setNewHealthItem({ ...newHealthItem, label: e.target.value })}
                      placeholder="e.g. Asthma, Appendectomy, Penicillin"
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Details (Optional)</label>
                  <input
                    type="text"
                    value={newHealthItem.detail}
                    onChange={e => setNewHealthItem({ ...newHealthItem, detail: e.target.value })}
                    placeholder="e.g. Diagnosed in 2018, mild reaction"
                    className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHealthItem(false)}
                    className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHealthItem}
                    className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-plum-700"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'medicines_supplements':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Active & Past Medicines</span>
              <button
                type="button"
                onClick={() => setShowAddMedicine(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Medicine
              </button>
            </div>

            {medicines.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No medicines recorded.</p>
            ) : (
              <div className="divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
                {medicines.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">{m.name}</span>
                      {m.dose && <span className="ml-2 text-stone-600">{m.dose}</span>}
                      {m.frequency && <span className="ml-1 text-stone-400">({m.frequency})</span>}
                      <span className={`ml-2 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        m.status === 'active' ? 'bg-teal-100 text-teal-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {m.status}
                      </span>
                      {m.startDate && <p className="text-stone-400 text-[11px] mt-0.5">Started: {m.startDate}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-stone-500">
                        <input
                          type="checkbox"
                          checked={m.includeInSummary}
                          onChange={() => handleToggleMedicineSummary(m)}
                          className="rounded text-plum-600 focus:ring-plum-500"
                        />
                        <span className="text-[11px]">Include</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(m.id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddMedicine && (
              <div className="rounded-xl border border-plum-200 bg-plum-50/40 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Medicine / Supplement Name</label>
                    <input
                      type="text"
                      value={newMedicine.name}
                      onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      placeholder="e.g. Metformin, Iron supplement"
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Dose & Frequency</label>
                    <input
                      type="text"
                      value={newMedicine.dose}
                      onChange={e => setNewMedicine({ ...newMedicine, dose: e.target.value })}
                      placeholder="e.g. 500mg daily with breakfast"
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newMedicine.startDate}
                      onChange={e => setNewMedicine({ ...newMedicine, startDate: e.target.value })}
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Status</label>
                    <select
                      value={newMedicine.status}
                      onChange={e => setNewMedicine({ ...newMedicine, status: e.target.value as any })}
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    >
                      <option value="active">Active (Taking now)</option>
                      <option value="discontinued">Discontinued (Stopped)</option>
                      <option value="unknown">Unsure</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMedicine(false)}
                    className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMedicine}
                    className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-plum-700"
                  >
                    Save Medicine
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'reproductive_context':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Menstrual Cycle Pattern</label>
              <select
                value={data.cycleStatus || ''}
                onChange={e => handleUpdateSectionField('reproductive_context', 'cycleStatus', e.target.value)}
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              >
                <option value="">Select or leave blank</option>
                <option value="regular">Regular cycle</option>
                <option value="irregular">Irregular or changing cycle</option>
                <option value="no_longer_menstruating">No longer menstruating</option>
                <option value="unsure">Unsure</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Hormones / Contraception</label>
              <input
                type="text"
                value={data.contraceptionOrHormones || ''}
                onChange={e => handleUpdateSectionField('reproductive_context', 'contraceptionOrHormones', e.target.value)}
                placeholder="e.g. Mirena IUD, Oral pill, None"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">Pregnancy & Reproductive History (Optional)</label>
              <textarea
                rows={2}
                value={data.pregnancyHistory || ''}
                onChange={e => handleUpdateSectionField('reproductive_context', 'pregnancyHistory', e.target.value)}
                placeholder="e.g. Two term deliveries (2015, 2018), or prefer not to record"
                className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-plum-500"
              />
            </div>
          </div>
        );

      case 'life_events':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Dated Life Transitions & Events</span>
              <button
                type="button"
                onClick={() => setShowAddLifeEvent(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            </div>

            {lifeEvents.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No life events recorded.</p>
            ) : (
              <div className="divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
                {lifeEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">{e.title}</span>
                      <span className="ml-2 rounded bg-sand-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                        {e.category.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-stone-400">({e.date})</span>
                      {e.notes && <p className="text-stone-500 mt-0.5">{e.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLifeEvent(e.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddLifeEvent && (
              <div className="rounded-xl border border-plum-200 bg-plum-50/40 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      value={newLifeEvent.title}
                      onChange={e => setNewLifeEvent({ ...newLifeEvent, title: e.target.value })}
                      placeholder="e.g. Changed jobs, Relocated cities, Parent caregiving"
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newLifeEvent.date}
                      onChange={e => setNewLifeEvent({ ...newLifeEvent, date: e.target.value })}
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLifeEvent(false)}
                    className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLifeEvent}
                    className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-plum-700"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'care_team':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">My Clinicians & Allied Health</span>
              <button
                type="button"
                onClick={() => setShowAddCareTeam(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Provider
              </button>
            </div>

            {careTeam.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No care team members recorded.</p>
            ) : (
              <div className="divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
                {careTeam.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">{m.name}</span>
                      <span className="ml-2 rounded bg-sand-100 px-1.5 py-0.5 text-[10px] uppercase font-bold text-stone-600">
                        {m.role}
                      </span>
                      {m.clinic && <span className="ml-2 text-stone-500">• {m.clinic}</span>}
                      {m.phone && <p className="text-stone-400 text-[11px] mt-0.5">{m.phone}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCareTeam(m.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddCareTeam && (
              <div className="rounded-xl border border-plum-200 bg-plum-50/40 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Provider Name</label>
                    <input
                      type="text"
                      value={newCareMember.name}
                      onChange={e => setNewCareMember({ ...newCareMember, name: e.target.value })}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Role</label>
                    <select
                      value={newCareMember.role}
                      onChange={e => setNewCareMember({ ...newCareMember, role: e.target.value as any })}
                      className="w-full rounded-lg border border-sand-300 bg-white p-2 text-xs"
                    >
                      <option value="gp">General Practitioner (GP)</option>
                      <option value="specialist">Gynecologist / Specialist</option>
                      <option value="allied_health">Physiotherapist / Allied Health</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="nurse">Nurse</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCareTeam(false)}
                    className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCareTeam}
                    className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-plum-700"
                  >
                    Save Provider
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        // Free-text areas for family history, lifestyle, goals/worries, doctor notes
        return (
          <div>
            <textarea
              rows={3}
              value={data.notes || ''}
              onChange={e => handleUpdateSectionField(key, 'notes', e.target.value)}
              placeholder="Record your thoughts or leave blank..."
              className="w-full rounded-xl border border-sand-300 bg-white p-3 text-sm outline-none focus:border-plum-500"
            />
          </div>
        );
    }
  }
}
