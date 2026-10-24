import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Share2,
  Sparkles,
  Stethoscope,
  ListTodo,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  Clock,
  Shield,
  AlertCircle,
  Video,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  getAllEntries,
  saveConsultation,
  saveAppointmentDebrief,
  getFollowupTasks,
  saveFollowupTask,
  deleteFollowupTask,
} from '../../lib/db';
import { type SymptomEntry, type ConsultationSummary, getEntryDate, SEVERITY_COLORS } from '../../types/health';
import { v4 as uuidv4 } from 'uuid';
import { ShareDialog } from './ShareDialog';
import { api } from '../../lib/api';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { DoctorConsultationIllustration } from '../../components/ui/Illustrations';

export function ConsultationPage() {
  const [activeStage, setActiveStage] = useState<'prepare' | 'in_visit' | 'debrief'>('prepare');

  // Stage 1 (Prepare / Summary Extraction) State
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<'all' | '14d' | '30d' | '90d'>('30d');
  const [customStart] = useState('');
  const [customEnd] = useState('');
  const [optionalContext, setOptionalContext] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [summaryMethod, setSummaryMethod] = useState<'ai' | 'deterministic' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentSummaryId, setCurrentSummaryId] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [aiConsentGranted, setAiConsentGranted] = useState(false);
  const [showRecordSelector, setShowRecordSelector] = useState(false);
  const [symptomFilter, setSymptomFilter] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Stage 2 (During Visit) State
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [inVisitNotes, setInVisitNotes] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Stage 3 (Debrief & Tasks) State
  const [followupTasks, setFollowupTasks] = useState<any[]>([]);
  const [debriefForm, setDebriefForm] = useState({
    clinicianName: '',
    visitDate: new Date().toISOString().slice(0, 10),
    clinicalDiscussion: '',
    testsOrdered: '',
    prescriptionChanges: '',
    followupDate: '',
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [savingDebrief, setSavingDebrief] = useState(false);
  const [saveDebriefSuccess, setSaveDebriefSuccess] = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      const e = await getAllEntries();
      const sorted = e.sort((a, b) => getEntryDate(b).localeCompare(getEntryDate(a)));
      setEntries(sorted);

      // Pre-select entries from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoCutoff = thirtyDaysAgo.toISOString().slice(0, 10);

      const recentIds = sorted
        .filter(entry => {
          const d = getEntryDate(entry);
          return d && d >= isoCutoff;
        })
        .map(entry => entry.id);

      // If no entries in 30 days, select the most recent 10
      const initialSelection = recentIds.length > 0 ? recentIds : sorted.slice(0, 10).map(x => x.id);
      setSelectedEntryIds(new Set(initialSelection));

      // Check AI consent from backend
      try {
        const consents = await api.ai.getConsents();
        if (consents && consents.ai_summary) {
          setAiConsentGranted(true);
        }
      } catch {
        // Local mode
      }

      try {
        const localTasks = await getFollowupTasks();
        setFollowupTasks(localTasks || []);
      } catch (err) {
        console.warn('Failed to load local tasks:', err);
      }
    })();
  }, []);

  // Filter entries by date preset & symptom
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (datePreset !== 'all') {
      const days = datePreset === '14d' ? 14 : datePreset === '30d' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const iso = cutoff.toISOString().slice(0, 10);
      result = result.filter(e => {
        const d = getEntryDate(e);
        return d && d >= iso;
      });
    } else if (customStart || customEnd) {
      result = result.filter(e => {
        const d = getEntryDate(e);
        if (!d) return false;
        if (customStart && d < customStart) return false;
        if (customEnd && d > customEnd) return false;
        return true;
      });
    }

    if (symptomFilter) {
      result = result.filter(e => e.symptom === symptomFilter);
    }

    return result;
  }, [entries, datePreset, customStart, customEnd, symptomFilter]);

  const uniqueSymptoms = useMemo(() => {
    return Array.from(new Set(entries.map(e => e.symptom))).sort();
  }, [entries]);

  // Bulk record selection
  const handleSelectAll = () => {
    setSelectedEntryIds(new Set(filteredEntries.map(e => e.id)));
  };

  const handleDeselectAll = () => {
    setSelectedEntryIds(new Set());
  };

  const toggleEntrySelection = (id: string) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Local deterministic summary generator (used when offline or when user chooses non-AI)
  const buildLocalSummary = (selectedList: SymptomEntry[], contextNote: string): string => {
    const lines: string[] = [];
    lines.push('===========================================================');
    lines.push('            CLINICAL APPOINTMENT SUMMARY');
    lines.push('               HerHealth Companion');
    lines.push(`            Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    lines.push('===========================================================');
    lines.push('');
    lines.push('This summary compiles self-reported health records to support communication with');
    lines.push('your healthcare professional. It is descriptive and does not provide a diagnosis.');
    lines.push('If you are worried, speak to a health professional.');
    lines.push('');

    // Date range & coverage
    const dates = selectedList.map(e => getEntryDate(e)).filter(Boolean).sort();
    const startDate = dates[0] || 'Unknown';
    const endDate = dates[dates.length - 1] || 'Unknown';
    lines.push(`RECORD COVERAGE: ${selectedList.length} check-in(s) across ${new Set(dates).size} day(s) (${startDate} to ${endDate})`);
    lines.push('');

    // Context note if provided
    if (contextNote.trim()) {
      lines.push('1. INDIVIDUAL FOCUS & NOTED CHANGES');
      lines.push(contextNote.trim());
      lines.push('');
    }

    // Symptom Frequencies
    lines.push('2. RECORDED SYMPTOM FREQUENCIES');
    const freq: Record<string, { count: number; severities: number[] }> = {};
    selectedList.forEach(e => {
      if (!freq[e.symptom]) freq[e.symptom] = { count: 0, severities: [] };
      freq[e.symptom].count++;
      if (e.severity) freq[e.symptom].severities.push(e.severity);
    });

    const sortedFreq = Object.entries(freq).sort((a, b) => b[1].count - a[1].count);
    if (sortedFreq.length > 0) {
      sortedFreq.forEach(([symptom, data]) => {
        let line = `  • ${symptom}: recorded in ${data.count} check-in(s)`;
        if (data.severities.length > 0) {
          const avg = (data.severities.reduce((a, b) => a + b, 0) / data.severities.length).toFixed(1);
          line += ` (average severity: ${avg}/5, range: ${Math.min(...data.severities)}–${Math.max(...data.severities)})`;
        } else {
          line += ' (severity: not recorded)';
        }
        lines.push(line);
      });
    } else {
      lines.push('  • No symptoms selected in this period.');
    }
    lines.push('');

    // Wellbeing observations (Sleep, Mood, Energy)
    lines.push('3. WELLBEING MEASURES');
    const sleepIssues = selectedList.filter(e => e.sleepQuality && e.sleepQuality <= 2).length;
    const moodLows = selectedList.filter(e => e.mood && e.mood <= 2).length;
    const energyLows = selectedList.filter(e => e.energy && e.energy <= 2).length;

    const wbParts: string[] = [];
    if (sleepIssues > 0) wbParts.push(`Disrupted or poor sleep recorded in ${sleepIssues} check-in(s)`);
    if (moodLows > 0) wbParts.push(`Low mood recorded in ${moodLows} check-in(s)`);
    if (energyLows > 0) wbParts.push(`Low energy recorded in ${energyLows} check-in(s)`);

    if (wbParts.length > 0) {
      wbParts.forEach(p => lines.push(`  • ${p}`));
    } else {
      lines.push('  • No persistent wellbeing lows recorded in the selected check-ins.');
    }
    lines.push('');

    // Functional & Daily Impact
    lines.push('4. FUNCTIONAL & DAILY LIFE IMPACT');
    const impactNotes = selectedList.filter(e => e.dailyImpact && e.dailyImpact.trim());
    if (impactNotes.length > 0) {
      impactNotes.slice(0, 5).forEach(e => {
        lines.push(`  • [${getEntryDate(e) || 'Date not recorded'} - ${e.symptom}]: "${e.dailyImpact}"`);
      });
      if (impactNotes.length > 5) {
        lines.push(`  • ... and ${impactNotes.length - 5} additional impact record(s).`);
      }
    } else {
      lines.push('  • Daily life impact: not recorded in the selected check-ins.');
    }
    lines.push('');

    // Relevant Notes & Medications
    lines.push('5. MEDICATIONS & CARE NOTES');
    const meds = selectedList.filter(e => e.medications && e.medications.trim());
    if (meds.length > 0) {
      meds.forEach(e => {
        lines.push(`  • [${getEntryDate(e) || 'Date'}] ${e.symptom}: ${e.medications}`);
      });
    } else {
      lines.push('  • Medications / interventions: not recorded in the selected check-ins.');
    }
    lines.push('');

    // Doctor Questions
    lines.push('6. QUESTIONS YOU MAY WISH TO DISCUSS');
    lines.push('  • How do these symptom patterns correlate with my current health stage?');
    if (sleepIssues > 0) lines.push('  • Are there safe strategies to address the sleep disruption I have been experiencing?');
    if (sortedFreq[0]) lines.push(`  • What investigative or support options exist for ${sortedFreq[0][0].toLowerCase()}?`);
    lines.push('  • What signs or threshold changes should prompt earlier medical review?');
    lines.push('');

    // Missing information transparency
    lines.push('7. INFORMATION GAPS & LIMITATIONS');
    lines.push('  • This report is strictly based on the entries selected above.');
    lines.push('  • Days without entries are not assumed to be symptom-free.');
    lines.push('  • All severity and wellbeing ratings are subjective, self-reported metrics.');
    lines.push('');
    lines.push('===========================================================');
    lines.push('Prepared from user-selected records. Reviewed by individual before visit.');

    return lines.join('\n');
  };

  // Generate Summary Handler (AI or Deterministic)
  const handleGenerateSummary = async (preferAi = true) => {
    const selectedList = entries.filter(e => selectedEntryIds.has(e.id));
    if (selectedList.length === 0) {
      alert('Please select at least one record to generate your summary.');
      return;
    }

    // Check if AI requested but consent not yet granted
    if (preferAi && !aiConsentGranted) {
      setShowConsentModal(true);
      return;
    }

    setIsGenerating(true);
    const summaryId = uuidv4();
    setCurrentSummaryId(summaryId);
    const now = new Date().toISOString();

    let text = '';
    let methodUsed: 'ai' | 'deterministic' = 'deterministic';

    if (preferAi) {
      try {
        const response = await api.ai.draftSummary(
          Array.from(selectedEntryIds),
          optionalContext.trim() || undefined
        );

        if (response && response.draft) {
          text = response.draft;
          methodUsed = response.method === 'ai' ? 'ai' : 'deterministic';
        } else {
          text = buildLocalSummary(selectedList, optionalContext);
          methodUsed = 'deterministic';
        }
      } catch (err: any) {
        console.warn('AI summary extraction failed or offline, using smart local engine:', err);
        text = buildLocalSummary(selectedList, optionalContext);
        methodUsed = 'deterministic';
      }
    } else {
      text = buildLocalSummary(selectedList, optionalContext);
      methodUsed = 'deterministic';
    }

    setSummaryText(text);
    setSummaryMethod(methodUsed);

    // Save summary locally
    const summaryRecord: ConsultationSummary = {
      id: summaryId,
      whatChanged: optionalContext || '',
      mainConcerns: selectedList.slice(0, 3).map(e => e.symptom).join(', '),
      firstNoticed: '',
      dailyImpact: '',
      relevantRecords: '',
      questionsForDoctor: '',
      selectedEntryIds: Array.from(selectedEntryIds),
      generatedText: text,
      editedText: text,
      createdAt: now,
      updatedAt: now,
    };

    await saveConsultation(summaryRecord);

    // Extract questions for Stage 2 checklist
    const extractedQuestions = text
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('  •') || line.includes('?'))
      .map(q => q.replace(/^[-*•0-9.)\s]+/, '').trim())
      .filter(q => q.endsWith('?') || q.toLowerCase().includes('discuss'))
      .slice(0, 6)
      .map((qText, idx) => ({ id: `q-auto-${idx}`, text: qText, done: false }));

    if (extractedQuestions.length > 0) {
      setChecklist(extractedQuestions);
    }

    setIsGenerating(false);
  };

  const handleGrantConsentAndGenerate = async () => {
    try {
      await api.ai.updateConsent('ai_summary', true);
      setAiConsentGranted(true);
    } catch {
      // Local fallback
      setAiConsentGranted(true);
    }
    setShowConsentModal(false);
    void handleGenerateSummary(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const addChecklistItem = (text: string) => {
    if (!text.trim()) return;
    setChecklist(prev => [...prev, { id: `q-${Date.now()}`, text: text.trim(), done: false }]);
  };

  // Debrief Handlers
  const handleSaveDebrief = async () => {
    setSavingDebrief(true);
    try {
      const id = `deb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const payload = {
        id,
        clinicianName: debriefForm.clinicianName.trim() || undefined,
        visitDate: debriefForm.visitDate,
        clinicalDiscussion: debriefForm.clinicalDiscussion.trim() || undefined,
        testsOrdered: debriefForm.testsOrdered.trim() || undefined,
        prescriptionChanges: debriefForm.prescriptionChanges.trim() || undefined,
        followupDate: debriefForm.followupDate.trim() || undefined,
      };

      await saveAppointmentDebrief(payload);
      setSaveDebriefSuccess(true);
      setTimeout(() => setSaveDebriefSuccess(false), 3000);

      setDebriefForm({
        clinicianName: '',
        visitDate: new Date().toISOString().slice(0, 10),
        clinicalDiscussion: '',
        testsOrdered: '',
        prescriptionChanges: '',
        followupDate: '',
      });
    } catch (err) {
      console.error('Failed to save debrief:', err);
    } finally {
      setSavingDebrief(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const taskRecord = {
      id: taskId,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || undefined,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    await saveFollowupTask(taskRecord);
    setFollowupTasks(prev => [taskRecord, ...prev]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  const handleToggleTaskStatus = async (task: any) => {
    const updated = {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
      updatedAt: new Date().toISOString(),
    };
    await saveFollowupTask(updated);
    setFollowupTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
  };

  const handleDeleteTask = async (id: string) => {
    await deleteFollowupTask(id);
    setFollowupTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* 3-Stage Navigation Header */}
      <ScrollReveal>
        <div className="no-print rounded-2xl border border-sand-200/90 bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-plum-600">
                Care Consultation Companion
              </span>
              <h2 className="text-lg font-bold text-stone-900">Appointment Management & Support</h2>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-sand-100 p-1 border border-sand-200">
              <button
                onClick={() => setActiveStage('prepare')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeStage === 'prepare'
                    ? 'bg-white text-plum-700 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-plum-600" />
                1. Before Visit (Summary)
              </button>
              <button
                onClick={() => setActiveStage('in_visit')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeStage === 'in_visit'
                    ? 'bg-plum-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                2. During Visit
              </button>
              <button
                onClick={() => setActiveStage('debrief')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeStage === 'debrief'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ListTodo className="h-3.5 w-3.5" />
                3. After Visit (Debrief)
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* STAGE 1: BEFORE VISIT (AUTOMATIC SUMMARY EXTRACTION)         */}
      {/* ============================================================ */}
      {activeStage === 'prepare' && (
        <div className="space-y-6">
          <PageHeader
            title="Appointment Preparation Summary"
            description="Select recorded experiences to automatically extract an organized clinical summary for your doctor."
          />

          {!summaryText ? (
            /* Record Selection & Generation View */
            <ScrollReveal>
              <div className="rounded-3xl border border-sand-200/90 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-xl space-y-6">
                {/* Hero Feature Banner with Illustration */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-plum-50 via-white to-teal-50/50 p-6 border border-plum-100">
                  <div className="space-y-2 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-plum-100 px-3 py-1 text-xs font-bold text-plum-700">
                      <Sparkles className="h-3.5 w-3.5 text-plum-600" />
                      Automatic Extraction
                    </span>
                    <h3 className="text-xl font-bold text-stone-900">
                      Turn Recorded Check-ins into Doctor-Ready Notes
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      No long questionnaire required. Choose which journal entries to include, and our system extracts frequency, severity patterns, wellbeing metrics, and clinical discussion points.
                    </p>
                  </div>
                  <DoctorConsultationIllustration className="w-44 h-32 shrink-0 drop-shadow-sm" />
                </div>

                {/* Date Presets & Filters */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-plum-600" />
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                        Select Timeline Window:
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['14d', '30d', '90d', 'all'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDatePreset(p)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            datePreset === p
                              ? 'bg-plum-600 text-white shadow-sm'
                              : 'bg-sand-100 text-stone-600 hover:bg-sand-200'
                          }`}
                        >
                          {p === '14d' ? 'Last 14 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : 'All History'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Symptom + Toggle Records Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sand-100">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-stone-400" />
                      <select
                        value={symptomFilter}
                        onChange={e => setSymptomFilter(e.target.value)}
                        className="rounded-lg border border-sand-300 bg-white px-2.5 py-1 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-plum-400"
                        aria-label="Filter records by symptom"
                      >
                        <option value="">All Symptoms ({uniqueSymptoms.length})</option>
                        {uniqueSymptoms.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-500">
                        {selectedEntryIds.size} of {filteredEntries.length} records selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRecordSelector(!showRecordSelector)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sand-300 bg-sand-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-sand-100 transition"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        {showRecordSelector ? 'Hide Records' : 'Review / Deselect Records'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Record Selection List */}
                {showRecordSelector && (
                  <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-sand-200">
                      <span className="font-semibold text-stone-700">Check entries to include:</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-plum-600 hover:text-plum-700 font-medium"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-stone-500 hover:text-stone-700"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {filteredEntries.length === 0 ? (
                        <p className="text-xs text-stone-400 py-3 text-center">No entries found for this date range.</p>
                      ) : (
                        filteredEntries.map(entry => {
                          const isSelected = selectedEntryIds.has(entry.id);
                          const entryDate = getEntryDate(entry);
                          return (
                            <div
                              key={entry.id}
                              onClick={() => toggleEntrySelection(entry.id)}
                              className={`flex items-start gap-3 rounded-xl border p-2.5 cursor-pointer transition ${
                                isSelected
                                  ? 'border-plum-300 bg-white shadow-xs'
                                  : 'border-sand-200 bg-white/60 opacity-60'
                              }`}
                            >
                              <button
                                type="button"
                                className="mt-0.5 text-plum-600"
                                aria-label={isSelected ? 'Deselect record' : 'Select record'}
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-plum-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-stone-400" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-stone-800">{entry.symptom}</span>
                                  <span className="text-[10px] text-stone-400">{entryDate || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                                  {entry.severity && (
                                    <span
                                      className="rounded-full px-1.5 py-0.2 text-[9px] font-bold text-white"
                                      style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}
                                    >
                                      Severity {entry.severity}/5
                                    </span>
                                  )}
                                  {entry.sleepQuality && <span>Sleep: {entry.sleepQuality}/5</span>}
                                  {entry.mood && <span>Mood: {entry.mood}/5</span>}
                                </div>
                                {entry.notes && (
                                  <p className="text-[11px] text-stone-500 mt-1 truncate">"{entry.notes}"</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Optional Personal Note / Context (Completely Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Additional Context or Focus for Clinician <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={optionalContext}
                    onChange={e => setOptionalContext(e.target.value)}
                    rows={2}
                    placeholder="e.g. Focus on hot flashes interrupting work sleep, or questions regarding dosage changes..."
                    className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-sand-100">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <Shield className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>Non-diagnostic, privacy-guarded clinical draft</span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isGenerating || selectedEntryIds.size === 0}
                      onClick={() => handleGenerateSummary(false)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-sand-50 transition disabled:opacity-50"
                    >
                      <FileText className="h-3.5 w-3.5 text-stone-500" />
                      Deterministic Summary
                    </button>

                    <button
                      type="button"
                      disabled={isGenerating || selectedEntryIds.size === 0}
                      onClick={() => handleGenerateSummary(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-plum-600 to-plum-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-plum-900/15 hover:from-plum-700 hover:to-plum-800 transition disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Extracting Summary...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Extract Summary with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            /* Summary Editor & Review View */
            <ScrollReveal>
              <div className="space-y-4">
                {/* Method & Evidence Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-sand-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    {summaryMethod === 'ai' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-plum-100 px-3 py-1 text-xs font-bold text-plum-700">
                        <Sparkles className="h-3.5 w-3.5 text-plum-600" />
                        AI-Assisted Synthesis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                        <FileText className="h-3.5 w-3.5 text-teal-600" />
                        Evidence-Linked Local Summary
                      </span>
                    )}
                    <span className="text-xs text-stone-500">
                      Based on {selectedEntryIds.size} selected record(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSummaryText('')}
                      className="inline-flex items-center gap-1 rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-sand-50 transition"
                    >
                      <RefreshCw className="h-3 w-3" /> Adjust Records
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-2.5 no-print">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 bg-white border border-sand-200 rounded-xl px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-sand-50 transition shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Text'}
                  </button>

                  <button
                    onClick={() => setShareDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-white border border-sand-200 rounded-xl px-4 py-2 text-xs text-plum-700 hover:bg-plum-50 transition font-semibold shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-plum-600" /> Create Share Link
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 bg-plum-600 text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-plum-700 transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>

                  <button
                    onClick={() => setActiveStage('in_visit')}
                    className="inline-flex items-center gap-1.5 bg-teal-600 text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-teal-700 transition ml-auto shadow-sm"
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Take into Visit Mode →
                  </button>
                </div>

                {/* Editable Text Area */}
                <div ref={printRef} className="bg-white border border-sand-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <div className="mb-3 text-[11px] text-stone-400 no-print flex items-center justify-between">
                    <span>You can edit or add notes directly below before exporting:</span>
                    <span>{summaryText.length} characters</span>
                  </div>
                  <textarea
                    value={summaryText}
                    onChange={e => setSummaryText(e.target.value)}
                    rows={Math.max(18, summaryText.split('\n').length + 2)}
                    className="w-full font-mono text-xs sm:text-sm text-stone-800 outline-none resize-none leading-relaxed border-none p-0 bg-transparent"
                    aria-label="Editable appointment summary"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 no-print text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Clinical Transparency:</strong> This document organizes your self-reported experiences. If you are worried, speak to a health professional.
                  </span>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* AI Consent Modal */}
          {showConsentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-sand-200">
                <div className="flex items-center gap-2.5 text-plum-700 font-bold">
                  <Sparkles className="h-5 w-5 text-plum-600" />
                  <h3>AI Summary Extraction Consent</h3>
                </div>
                <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                  <p>
                    HerHealth Companion can use an intelligent clinical summarizer to synthesize your selected entries into structured consultation notes.
                  </p>
                  <ul className="list-disc ml-4 space-y-1 text-stone-500">
                    <li>Only the <strong>{selectedEntryIds.size} records you selected</strong> are processed.</li>
                    <li>No diagnoses or health risk scores are made.</li>
                    <li>Missing fields remain explicitly labeled as <em>not recorded</em>.</li>
                    <li>You can review and edit every word before bringing it to your clinician.</li>
                  </ul>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConsentModal(false);
                      void handleGenerateSummary(false);
                    }}
                    className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-sand-50"
                  >
                    Use Local Engine Only
                  </button>
                  <button
                    type="button"
                    onClick={handleGrantConsentAndGenerate}
                    className="rounded-xl bg-plum-600 px-4 py-2 text-xs font-bold text-white hover:bg-plum-700 transition"
                  >
                    Grant Consent & Extract
                  </button>
                </div>
              </div>
            </div>
          )}

          <ShareDialog
            isOpen={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            summaryId={currentSummaryId}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* STAGE 2: DURING VISIT (IN-CONSULTATION MODE)                 */}
      {/* ============================================================ */}
      {activeStage === 'in_visit' && (
        <ScrollReveal>
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-plum-500 bg-stone-900 text-white p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block rounded-md bg-plum-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-plum-200">
                    In-Consultation Mode
                  </span>
                  <h2 className="text-xl font-bold mt-1 text-white">Active Visit Companion</h2>
                  <p className="text-xs text-stone-300 mt-1">
                    High-contrast checklist and quick notepad to ensure your priority questions are addressed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="/teleconsult"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 border border-stone-700 px-3.5 py-2 text-xs font-semibold text-plum-300 hover:bg-stone-700 transition"
                  >
                    <Video className="h-4 w-4" />
                    Simulated Consult
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 border border-stone-700 px-3.5 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition"
                  >
                    <QrCode className="h-4 w-4 text-plum-400" />
                    {showQrModal ? 'Hide Share Link' : 'Show Share Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStage('debrief')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-teal-400 transition"
                  >
                    Done with Visit <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick Share Link Banner if toggled */}
              {showQrModal && (
                <div className="mt-5 rounded-xl border border-stone-700 bg-stone-800 p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-200">Share Summary with Clinician</span>
                    <button
                      onClick={() => setShareDialogOpen(true)}
                      className="text-plum-400 hover:text-plum-300 text-xs font-medium"
                    >
                      Open Share Link Settings
                    </button>
                  </div>
                  <p className="text-stone-400">
                    Generate an expiring, read-only link your doctor can quickly scan on their device.
                  </p>
                </div>
              )}
            </div>

            {/* Checklist of Discussion Questions */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Key Questions & Items to Discuss</h3>
                  <p className="text-xs text-stone-500">Tap to check off as each topic is covered in your visit.</p>
                </div>
                <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                  {checklist.filter(i => i.done).length} of {checklist.length} completed
                </span>
              </div>

              <div className="space-y-2">
                {checklist.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    No questions added yet. You can add topics below or generate them from your summary.
                  </p>
                ) : (
                  checklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        item.done
                          ? 'border-sand-200 bg-sand-50/70 text-stone-400 line-through'
                          : 'border-sand-300 bg-white text-stone-800 hover:border-plum-400'
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-plum-600">
                        {item.done ? (
                          <CheckSquare className="h-4 w-4 text-teal-600" />
                        ) : (
                          <Square className="h-4 w-4 text-stone-400" />
                        )}
                      </button>
                      <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Add item input */}
              <div className="flex gap-2 pt-2 border-t border-sand-100">
                <input
                  type="text"
                  placeholder="Add another topic or question..."
                  className="flex-1 rounded-xl border border-sand-300 px-3.5 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addChecklistItem((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={e => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    addChecklistItem(input.value);
                    input.value = '';
                  }}
                  className="rounded-xl bg-sand-100 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-sand-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Quick in-visit note notepad */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Doctor's Advice & Immediate Notes</h3>
              <textarea
                value={inVisitNotes}
                onChange={e => setInVisitNotes(e.target.value)}
                rows={4}
                placeholder="Jot down dosage instructions, test names mentioned, or next steps..."
                className="w-full rounded-xl border border-sand-300 bg-sand-50/40 p-3 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
              />
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ============================================================ */}
      {/* STAGE 3: AFTER VISIT (POST-APPOINTMENT DEBRIEF & TASKS)       */}
      {/* ============================================================ */}
      {activeStage === 'debrief' && (
        <ScrollReveal>
          <div className="space-y-6">
            <PageHeader
              title="Post-Appointment Debrief"
              description="Record what was agreed, tests ordered, and follow-up tasks before you forget."
            />

            {/* Debrief Form */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-stone-900 text-base">Visit Outcomes & Instructions</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Clinician Name</label>
                  <input
                    type="text"
                    value={debriefForm.clinicianName}
                    onChange={e => setDebriefForm({ ...debriefForm, clinicianName: e.target.value })}
                    placeholder="e.g. Dr. Sarah Chen"
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={debriefForm.visitDate}
                    onChange={e => setDebriefForm({ ...debriefForm, visitDate: e.target.value })}
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">What Was Discussed / Care Plan</label>
                <textarea
                  value={debriefForm.clinicalDiscussion}
                  onChange={e => setDebriefForm({ ...debriefForm, clinicalDiscussion: e.target.value })}
                  rows={3}
                  placeholder="Key takeaways, explanations given, or lifestyle modifications recommended..."
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Prescription or Dosage Changes</label>
                  <input
                    type="text"
                    value={debriefForm.prescriptionChanges}
                    onChange={e => setDebriefForm({ ...debriefForm, prescriptionChanges: e.target.value })}
                    placeholder="e.g. Started iron supplements; reduced caffeine"
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tests or Referrals Ordered</label>
                  <input
                    type="text"
                    value={debriefForm.testsOrdered}
                    onChange={e => setDebriefForm({ ...debriefForm, testsOrdered: e.target.value })}
                    placeholder="e.g. Pelvic ultrasound, full blood count"
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveDebriefSuccess && (
                  <span className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                    <Check className="h-4 w-4" /> Debrief saved successfully!
                  </span>
                )}
                <button
                  type="button"
                  disabled={savingDebrief}
                  onClick={handleSaveDebrief}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition ml-auto disabled:opacity-50"
                >
                  {savingDebrief ? 'Saving...' : 'Save Debrief'}
                </button>
              </div>
            </div>

            {/* Follow-up Action Items & Tasks */}
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-stone-900 text-base">Follow-up Action Items</h3>

              <div className="space-y-2">
                {followupTasks.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3 text-center">No pending tasks.</p>
                ) : (
                  followupTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 p-2.5 bg-sand-50/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          className="text-teal-600"
                        >
                          {task.status === 'completed' ? (
                            <CheckSquare className="h-4 w-4 text-teal-600" />
                          ) : (
                            <Square className="h-4 w-4 text-stone-400" />
                          )}
                        </button>
                        <span className={`text-xs ${task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}`}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-stone-400 ml-1">Due: {task.dueDate}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-stone-400 hover:text-rose-500 text-xs px-2"
                        aria-label="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add task row */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-sand-100">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Schedule fasting blood test..."
                  className="flex-1 rounded-xl border border-sand-300 px-3 py-1.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="rounded-xl border border-sand-300 px-3 py-1.5 text-xs text-stone-800 outline-none focus:ring-2 focus:ring-plum-300"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="rounded-xl bg-plum-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-plum-700 transition"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
