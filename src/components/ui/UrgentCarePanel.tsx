import { AlertOctagon, Phone, X, ShieldAlert, HeartPulse } from 'lucide-react';

interface UrgentCarePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RED_FLAG_SYMPTOMS = [
  'Sudden, severe, or sharply worsening lower abdominal or pelvic pain',
  'Very heavy bleeding (soaking through two or more pads or tampons per hour for two consecutive hours)',
  'Fever (>38.5°C) accompanied by pelvic tenderness, chills, or unusual discharge',
  'Severe shortness of breath, sudden chest pain, or coughing up blood',
  'Sudden painful swelling or redness in one calf or leg',
  'Sudden severe headache, visual changes (flashes/blind spots), or sudden confusion',
  'Feeling faint, dizziness upon standing, or loss of consciousness',
];

export function UrgentCarePanel({ isOpen, onClose }: UrgentCarePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-stone-400 hover:bg-sand-100 hover:text-stone-700 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertOctagon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Urgent Care Warning Signs</h2>
            <p className="text-xs text-stone-500">When to seek immediate clinical or emergency assistance</p>
          </div>
        </div>

        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-1 flex items-center gap-1.5">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            Immediate Action Red Flags
          </p>
          <p className="text-xs text-rose-800 leading-relaxed mb-3">
            If you or someone you are supporting experiences any of the following symptoms, please contact emergency services (<strong>000</strong>) or present to the nearest hospital emergency department:
          </p>
          <ul className="space-y-2 text-xs text-stone-800">
            {RED_FLAG_SYMPTOMS.map((symptom, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="text-sm font-bold text-stone-900 mb-3">Australian Support & Emergency Contacts</h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <a
            href="tel:000"
            className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3.5 transition hover:bg-rose-100"
          >
            <Phone className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-900">000 (Triple Zero)</div>
              <div className="text-[11px] text-rose-700">Immediate Life-Threatening Emergency</div>
            </div>
          </a>

          <a
            href="tel:1800022222"
            className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3.5 transition hover:bg-sand-100"
          >
            <Phone className="h-5 w-5 text-teal-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">1800 022 222 (Healthdirect)</div>
              <div className="text-[11px] text-stone-600">24/7 Registered Nurse Advice</div>
            </div>
          </a>

          <a
            href="tel:131114"
            className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3.5 transition hover:bg-sand-100"
          >
            <Phone className="h-5 w-5 text-plum-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">13 11 14 (Lifeline)</div>
              <div className="text-[11px] text-stone-600">24/7 Crisis Support & Counselling</div>
            </div>
          </a>

          <a
            href="tel:1800737732"
            className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3.5 transition hover:bg-sand-100"
          >
            <Phone className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">1800 737 732 (1800RESPECT)</div>
              <div className="text-[11px] text-stone-600">Domestic, Family & Sexual Violence Support</div>
            </div>
          </a>
        </div>

        <div className="rounded-xl bg-sand-100 p-3 text-[11px] text-stone-600 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
          <span>
            HerHealth Companion is a personal health tracking journal and does not provide clinical monitoring, diagnostics, or emergency dispatch.
          </span>
        </div>
      </div>
    </div>
  );
}
