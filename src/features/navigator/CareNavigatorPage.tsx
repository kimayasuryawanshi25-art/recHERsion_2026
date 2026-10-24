import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Calendar,
  Heart,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  FileText,
  Info,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  assessCareLevel,
  type CareNavigatorInputs,
  type CareAssessmentResult,
} from '@rechersion/shared';
import { api } from '../../lib/api';

export function CareNavigatorPage() {
  const [formData, setFormData] = useState<CareNavigatorInputs>({
    suddenSeverePain: false,
    heavyBleeding: false,
    pregnantOrPostpartum: 'unknown',
    feverWithRigorsOrStiffNeck: false,
    shortnessOfBreathOrChestPain: false,
    dizzinessOrFainting: false,
    symptomDurationDays: 0,
    currentPrimaryConcern: '',
  });

  const [assessment, setAssessment] = useState<CareAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try server endpoint first (for authenticated audit event logging)
      const res = await api.navigator.assess(formData);
      if (res && res.assessment) {
        setAssessment(res.assessment);
        return;
      }
    } catch {
      // Offline fallback: evaluate locally via deterministic shared engine
    }

    const localResult = assessCareLevel(formData);
    setAssessment(localResult);
    setLoading(false);
  };

  const handleCopyQuestions = () => {
    if (!assessment) return;
    const text = assessment.questionsForDoctor.map(q => `• ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  const resetForm = () => {
    setAssessment(null);
    setFormData({
      suddenSeverePain: false,
      heavyBleeding: false,
      pregnantOrPostpartum: 'unknown',
      feverWithRigorsOrStiffNeck: false,
      shortnessOfBreathOrChestPain: false,
      dizzinessOrFainting: false,
      symptomDurationDays: 0,
      currentPrimaryConcern: '',
    });
  };

  const renderBadge = (level: string) => {
    switch (level) {
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            <AlertOctagon className="h-4 w-4 text-rose-600" />
            EMERGENCY CARE
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            URGENT CARE (12–24h)
          </span>
        );
      case 'routine':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-[#5B4B8A]">
            <Calendar className="h-4 w-4 text-[#5B4B8A]" />
            ROUTINE APPOINTMENT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
            <Heart className="h-4 w-4 text-teal-600" />
            SELF-CARE & OBSERVATION
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Care Navigator"
        description="Guidance on where, how soon, and who to see based on your observable symptoms."
      />

      {/* Mandatory Non-Diagnostic Public Guidance Disclaimer */}
      <div className="rounded-2xl border border-sand-300 bg-sand-100/70 p-4 text-xs leading-relaxed text-stone-700">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#5B4B8A]" />
          <div>
            <strong>Sample Public Health Triage Guidance:</strong> This navigator provides informational guidance adapted from World Health Organization (ETAT) and national health service protocols. It does not provide medical diagnoses or rank disease probabilities. If you are worried, speak to a health professional.
          </div>
        </div>
      </div>

      {!assessment ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Check Your Symptoms & Red Flags</h2>
            <p className="mt-1 text-xs text-stone-500">
              Select all observable indicators you are experiencing today. If an emergency red flag is present, you will be guided directly to immediate care.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 transition hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shortnessOfBreathOrChestPain}
                onChange={e => setFormData({ ...formData, shortnessOfBreathOrChestPain: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
              />
              <div className="text-sm">
                <span className="font-semibold text-stone-900">Shortness of breath, chest pressure, or difficulty breathing</span>
                <p className="text-xs text-stone-500 mt-0.5">Acute breathing struggle, chest tightness, or inability to speak full sentences.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 transition hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.suddenSeverePain}
                onChange={e => setFormData({ ...formData, suddenSeverePain: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
              />
              <div className="text-sm">
                <span className="font-semibold text-stone-900">Sudden, severe, or unbearable pain</span>
                <p className="text-xs text-stone-500 mt-0.5">Sudden sharp abdominal, pelvic, or head pain that came on abruptly or is intolerable.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 transition hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.heavyBleeding}
                onChange={e => setFormData({ ...formData, heavyBleeding: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
              />
              <div className="text-sm">
                <span className="font-semibold text-stone-900">Very heavy vaginal bleeding</span>
                <p className="text-xs text-stone-500 mt-0.5">Soaking through two or more pads or tampons every hour for two hours in a row, or passing large clots.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 transition hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dizzinessOrFainting}
                onChange={e => setFormData({ ...formData, dizzinessOrFainting: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
              />
              <div className="text-sm">
                <span className="font-semibold text-stone-900">Dizziness, fainting, or severe lightheadedness</span>
                <p className="text-xs text-stone-500 mt-0.5">Feeling faint upon standing, blacking out, or confusion.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 transition hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.feverWithRigorsOrStiffNeck}
                onChange={e => setFormData({ ...formData, feverWithRigorsOrStiffNeck: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
              />
              <div className="text-sm">
                <span className="font-semibold text-stone-900">High fever with shaking chills (rigors) or neck stiffness</span>
                <p className="text-xs text-stone-500 mt-0.5">Body shivering uncontrollably, high temperature (&gt;38.5°C), or pain bending neck forward.</p>
              </div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-sand-200">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Are you currently pregnant or recently gave birth?</label>
              <select
                value={formData.pregnantOrPostpartum}
                onChange={e => setFormData({ ...formData, pregnantOrPostpartum: e.target.value as any })}
                className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
              >
                <option value="unknown">Not sure / prefer not to say</option>
                <option value="no">No</option>
                <option value="yes">Yes (Currently pregnant or &lt;6 weeks postpartum)</option>
                <option value="possible">Possible (Could be pregnant)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">How many days have you had these symptoms?</label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.symptomDurationDays}
                onChange={e => setFormData({ ...formData, symptomDurationDays: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Primary concern or notes (Optional)</label>
            <textarea
              rows={2}
              value={formData.currentPrimaryConcern}
              onChange={e => setFormData({ ...formData, currentPrimaryConcern: e.target.value })}
              placeholder="e.g. Started after workout; noticed unusual lower back cramps..."
              className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#5B4B8A] py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-900/10 transition hover:bg-[#493B72] focus:outline-none focus:ring-2 focus:ring-[#9B72CF]"
          >
            {loading ? 'Evaluating Guideline Criteria...' : 'View Care Guidance'}
          </button>
        </form>
      ) : (
        /* Assessment Result Card */
        <div className="space-y-6">
          <div
            className={`rounded-3xl border p-6 shadow-sm backdrop-blur-md sm:p-8 ${
              assessment.careLevel === 'emergency'
                ? 'border-rose-300 bg-rose-50/70'
                : assessment.careLevel === 'urgent'
                ? 'border-amber-300 bg-amber-50/70'
                : assessment.careLevel === 'routine'
                ? 'border-violet-200 bg-[#EDE7F6]/50'
                : 'border-teal-200 bg-teal-50/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {renderBadge(assessment.careLevel)}
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Change Answers
              </button>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
              {assessment.careLevel === 'emergency'
                ? 'Immediate Emergency Evaluation Recommended'
                : assessment.careLevel === 'urgent'
                ? 'Same-Day Urgent Care Recommended'
                : assessment.careLevel === 'routine'
                ? 'Schedule a Routine Healthcare Appointment'
                : 'Safe Observation & Home Comfort'}
            </h2>

            {/* Practical Care Matrix */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <Clock className="h-4 w-4 text-[#5B4B8A]" />
                  How Soon
                </div>
                <p className="mt-2 text-sm font-semibold text-stone-900">{assessment.timeframe}</p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4 text-[#5B4B8A]" />
                  Where to Go
                </div>
                <p className="mt-2 text-sm font-semibold text-stone-900">{assessment.whereToSeek}</p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <Heart className="h-4 w-4 text-[#5B4B8A]" />
                  Who to See
                </div>
                <p className="mt-2 text-sm font-semibold text-stone-900">{assessment.whoToSee}</p>
              </div>
            </div>

            {/* Why This Was Recommended */}
            <div className="mt-6 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900">Why this care level was recommended:</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                {assessment.reasoning.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#5B4B8A]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions to Ask Doctor */}
            <div className="mt-6 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Suggested questions for your healthcare visit:</h3>
                <button
                  type="button"
                  onClick={handleCopyQuestions}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#5B4B8A] hover:underline"
                >
                  {copiedQuestions ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-teal-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Questions</span>
                    </>
                  )}
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-stone-700">
                {assessment.questionsForDoctor.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-sand-50/70 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDE7F6] text-[10px] font-bold text-[#5B4B8A]">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Action CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              {assessment.careLevel === 'emergency' && (
                <a
                  href="tel:000"
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-800"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call Emergency (000 / 112 / 911)
                </a>
              )}

              <Link
                to="/consultation"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#5B4B8A] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/10 transition hover:bg-[#493B72]"
              >
                <FileText className="h-4 w-4" />
                Prepare Visit Notes
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-sand-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-sand-50"
              >
                Start Over
              </button>
            </div>

            {/* Sourced Guideline Metadata Badge */}
            <div className="mt-6 pt-4 border-t border-sand-200/80 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
              <div className="flex items-center gap-1.5">
                <span>Guideline Source:</span>
                <a
                  href={assessment.sourceGuideline.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#5B4B8A] font-medium hover:underline"
                >
                  {assessment.sourceGuideline.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span>Verified On: <strong>{assessment.sourceGuideline.verifiedOn}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
