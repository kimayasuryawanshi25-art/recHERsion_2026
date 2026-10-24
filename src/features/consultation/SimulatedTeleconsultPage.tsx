import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Clock,
  CheckSquare,
  Square,
  ShieldAlert,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function SimulatedTeleconsultPage() {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const [questions, setQuestions] = useState([
    { id: '1', text: 'How do my recent symptom patterns relate to what I have recorded?', done: false },
    { id: '2', text: 'Should we order any blood tests, pelvic imaging, or iron studies?', done: false },
    { id: '3', text: 'What side effects or changes should prompt me to follow up sooner?', done: false },
  ]);

  const [notes, setNotes] = useState('');

  // Practice prompts for self-advocacy
  const DIALOGUE_PROMPTS = [
    {
      speaker: 'Dr. Sarah (Simulated GP)',
      text: 'Hello! Thanks for connecting today. I can see the consultation summary you prepared. Let’s start with what has felt most different or disruptive lately.',
      tip: 'Advocacy tip: Share your main concern directly within the first 60 seconds.',
    },
    {
      speaker: 'Dr. Sarah (Simulated GP)',
      text: 'Understood. Looking at your timeline notes, how has this been affecting your sleep, concentration, or work routines?',
      tip: 'Advocacy tip: Mention specific examples of daily activities that had to be canceled or modified.',
    },
    {
      speaker: 'Dr. Sarah (Simulated GP)',
      text: 'That gives very helpful context. What questions did you want to ensure we address before we conclude?',
      tip: 'Advocacy tip: Read your checklist questions below one by one and tick them off as answered.',
    },
  ];

  // Timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, done: !q.done } : q));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* Rule 11: Mandatory Prominent Demo Banner */}
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              SIMULATED TELECONSULTATION (DEMO ONLY — No live telehealth connection)
            </h2>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
              This interactive rehearsal environment lets you practice active self-advocacy and test your question checklist before your actual doctor visit. No audio, video, or data is transmitted.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Simulated Video Screen & Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex flex-col justify-between p-4">
            {/* Top Overlay: Call Status */}
            <div className="flex items-center justify-between text-white text-xs">
              <span className="flex items-center gap-2 rounded-lg bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Simulated Teleconsult · 15 Min Appointment
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 backdrop-blur-sm font-mono">
                <Clock className="h-3.5 w-3.5 text-stone-300" />
                {formatTimer(secondsElapsed)}
              </span>
            </div>

            {/* Center: Simulated Clinician Visual */}
            <div className="text-center my-auto">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-plum-700 to-teal-600 text-white shadow-xl ring-4 ring-white/10">
                <User className="h-12 w-12" />
              </div>
              <h3 className="mt-3 text-base font-bold text-white">Dr. Sarah (Simulated GP)</h3>
              <p className="text-xs text-stone-300">City General Practice · Teleconsultation</p>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMicOn(!micOn)}
                className={`rounded-full p-3 transition ${
                  micOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setCamOn(!camOn)}
                className={`rounded-full p-3 transition ${
                  camOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-rose-600 text-white'
                }`}
                title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/consultation')}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition flex items-center gap-1.5"
                title="End Simulated Call"
              >
                <PhoneOff className="h-4 w-4" />
                End Rehearsal
              </button>
            </div>
          </div>

          {/* Interactive Dialogue Practice Stage */}
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-plum-700">
                Dialogue Prompts ({activeStep + 1} of {DIALOGUE_PROMPTS.length})
              </span>
              <div className="flex gap-1.5">
                {DIALOGUE_PROMPTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`h-2 w-6 rounded-full transition ${
                      i === activeStep ? 'bg-plum-600' : 'bg-sand-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-sand-200 bg-sand-50/60 p-4 space-y-2">
              <span className="text-xs font-bold text-stone-900 block">
                {DIALOGUE_PROMPTS[activeStep].speaker}
              </span>
              <p className="text-sm text-stone-800 leading-relaxed italic">
                "{DIALOGUE_PROMPTS[activeStep].text}"
              </p>
              <div className="pt-2 border-t border-sand-200 flex items-center gap-1.5 text-xs font-medium text-teal-800">
                <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                {DIALOGUE_PROMPTS[activeStep].tip}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              {activeStep < DIALOGUE_PROMPTS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white hover:bg-plum-700 transition"
                >
                  Next Prompt <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/consultation')}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Log Visit Debrief <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: In-Visit Question Checklist & Notepad */}
        <div className="lg:col-span-5 space-y-4">
          {/* Question Checklist */}
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-sand-200 pb-2.5">
              <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                My Priority Questions
              </h3>
              <span className="text-[11px] font-bold text-plum-700 bg-plum-50 px-2 py-0.5 rounded">
                {questions.filter(q => q.done).length}/{questions.length} Addressed
              </span>
            </div>

            <div className="space-y-2">
              {questions.map(q => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleQuestion(q.id)}
                  className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl border text-xs transition ${
                    q.done
                      ? 'bg-stone-50 border-stone-200 text-stone-400 line-through'
                      : 'bg-white border-sand-300 text-stone-800 hover:border-plum-400 font-medium'
                  }`}
                >
                  {q.done ? (
                    <CheckSquare className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Notes During Call */}
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Live Rehearsal Notes
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Jot down notes or thoughts as you rehearse..."
              className="w-full rounded-xl border border-sand-300 p-3 text-xs outline-none focus:border-plum-500 resize-none"
            />
            <p className="text-[11px] text-stone-400 italic">
              These notes can be carried into your post-appointment debrief.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
