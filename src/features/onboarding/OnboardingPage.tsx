import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, HardDrive, Shield, Download, ChevronRight, Check } from 'lucide-react';
import { HEALTH_CONTEXTS, type HealthContextId, type UserSettings } from '../../types/health';
import { saveSettings, getSettings } from '../../lib/db';
import { getDemoEntries, getDemoSettings } from '../../data/demo-data';
import { saveEntry } from '../../lib/db';

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<HealthContextId[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggle = (id: HealthContextId) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const finish = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const settings: UserSettings = {
      id: 'user-settings', selectedContexts: selected, onboardingComplete: true,
      discreetMode: false, createdAt: now, updatedAt: now,
    };
    await saveSettings(settings);
    setLoading(false);
    navigate('/');
  };

  const loadDemo = async () => {
    setLoading(true);
    const entries = getDemoEntries();
    for (const e of entries) await saveEntry(e);
    const settings = getDemoSettings();
    await saveSettings(settings);
    setLoading(false);
    navigate('/');
  };

  if (step === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-plum-50 to-sand-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 md:p-12 text-center">
        <Heart className="w-16 h-16 text-rose-500 mx-auto mb-6" fill="currentColor" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to HerHealth Companion</h1>
        <p className="text-gray-500 mb-8">Your personal health information organizer</p>

        <div className="text-left space-y-3 mb-8">
          <p className="font-medium text-gray-700 mb-2">This app helps you:</p>
          {[
            'Record your health experiences in your own words',
            'Organize information into a chronological timeline',
            'Visualize patterns from your own records',
            'Prepare summaries for doctor visits',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" /><span>{t}</span>
            </div>
          ))}
        </div>

        <div className="text-left space-y-2 mb-8 bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="font-medium text-amber-800 text-sm">This app does not:</p>
          {[
            'Diagnose conditions or predict health outcomes',
            'Provide medical advice or treatment recommendations',
            'Replace professional healthcare',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-sm text-amber-700">
              <span className="shrink-0">✗</span><span>{t}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(1)} className="w-full bg-plum-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-plum-700 transition-colors flex items-center justify-center gap-2">
          Get Started <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={loadDemo} disabled={loading} className="w-full mt-3 text-plum-600 hover:text-plum-700 text-sm font-medium py-2">
          {loading ? 'Loading...' : 'Load demo data (Maya, fictional)'}
        </button>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-plum-50 to-sand-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 md:p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Data, Your Control</h2>
        <div className="space-y-4 mb-8">
          {[
            { icon: HardDrive, text: 'All data is stored locally in your browser — no account needed' },
            { icon: Shield, text: 'No data is sent to external servers' },
            { icon: Download, text: 'You can export and delete your data at any time' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-plum-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-600">{text}</span>
            </div>
          ))}
        </div>
        <div className="bg-sand-100 rounded-xl p-4 mb-8">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> Local storage means your data may be accessible to anyone using this browser profile. It is not encrypted. Previously exported files or screenshots are not affected by deletion within this app.
          </p>
        </div>
        <button onClick={() => setStep(2)} className="w-full bg-plum-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-plum-700 transition-colors flex items-center justify-center gap-2">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-plum-50 to-sand-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 md:p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choose Your Health Contexts</h2>
        <p className="text-gray-500 text-center text-sm mb-8">
          These help organize your records. They are not diagnoses. Select as many as relevant — you can change these anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {HEALTH_CONTEXTS.map(ctx => (
            <button
              key={ctx.id}
              onClick={() => toggle(ctx.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                selected.includes(ctx.id)
                  ? 'border-plum-400 bg-plum-50 shadow-sm'
                  : 'border-sand-200 hover:border-sand-300 bg-white'
              }`}
            >
              <span className="text-2xl">{ctx.emoji}</span>
              <div>
                <div className="font-medium text-gray-800 text-sm">{ctx.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{ctx.description}</div>
              </div>
              {selected.includes(ctx.id) && <Check className="w-5 h-5 text-plum-500 ml-auto shrink-0" />}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={finish} disabled={loading} className="flex-1 bg-plum-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-plum-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Get Started'}
          </button>
        </div>
        <button onClick={finish} className="w-full text-gray-400 hover:text-gray-600 text-sm mt-3 py-2">Skip for now</button>
      </div>
    </div>
  );
}
