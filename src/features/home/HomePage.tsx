
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ArrowRight,
  BookOpen,
  Activity,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Leaf,
  LockKeyhole,
} from 'lucide-react';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

const features = [
  {
    icon: BookOpen,
    title: 'Your health journal',
    description:
      'Record symptoms, energy, sleep, mood and notes in one organized place.',
    color: 'bg-[#EDE7F6] text-[#5B4B8A]',
    to: '/journal',
  },
  {
    icon: Activity,
    title: 'Patterns over time',
    description:
      'Review your recorded check-ins and reflect on changes over time.',
    color: 'bg-teal-100 text-teal-700',
    to: '/timeline',
  },
  {
    icon: CalendarDays,
    title: 'Prepare for appointments',
    description:
      'Organize your concerns, important changes and questions for your clinician.',
    color: 'bg-plum-100 text-plum-700',
    to: '/consultation',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-sand-50 text-stone-800">
      {/* Navigation */}
      <nav className="relative z-10 border-b border-sand-200/80 bg-sand-50/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDE7F6]">
              <Heart
                className="h-6 w-6 text-[#5B4B8A]"
                fill="currentColor"
              />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight sm:text-base">
                HerHealth Companion
              </span>
              <span className="block text-xs text-stone-500">
                Your personal health space
              </span>
            </span>
          </Link>

          <div className="flex items-center">
             <Link to="/overview"
                 className="inline-flex items-center justify-center rounded-xl border border-[#d8cebf] bg-white px-4 py-2.5 text-sm font-semibold text-[#4f3958] shadow-sm transition-all duration-200 hover:border-[#92799a] hover:bg-[#f6f2f7]"
             >
                 My dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
</div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-[#EDE7F6]/70 blur-3xl gradient-drift" />
        <div className="pointer-events-none absolute -left-20 top-52 h-64 w-64 rounded-full bg-teal-100/70 blur-3xl gradient-drift" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="page-enter">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-2 text-xs font-semibold text-teal-700 sm:text-sm">
              <Sparkles className="h-4 w-4" />
              A little more awareness, every day
            </span>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.13] tracking-tight text-stone-800 sm:text-5xl lg:text-6xl">
              Your health,
              <br />
              <span className="text-plum-600">at your pace.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              A gentle space to record how you feel, notice changes over time,
              and prepare for conversations about your health.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/overview')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#634b6c] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4f3958] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#634b6c]"
              >
                Start your health journey
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                to="/learning"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cebf] bg-white px-6 py-3.5 text-sm font-semibold text-[#342f2b] shadow-sm transition-all duration-200 hover:border-[#92799a] hover:bg-[#f6f2f7]"
              >
                Explore health resources
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-stone-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              No cloud account required
            </div>
          </div>

          {/* Decorative check-in preview */}
          <div className="relative mx-auto w-full max-w-lg page-enter card-float">
            <div className="absolute -right-3 top-12 h-24 w-24 rounded-full bg-rose-200/50 blur-2xl" />

            <div className="relative rounded-[28px] border border-white bg-white/90 p-5 shadow-xl shadow-stone-900/5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-teal-700">
                    Your daily check-in
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-800">
                    How are you feeling?
                  </h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE7F6]">
                  <Heart className="h-6 w-6 text-[#5B4B8A]" />
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-stone-500">
                There is no perfect way to feel. Start by noticing what matters
                to you today.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { emoji: '🌸', label: 'Symptoms', detail: 'What did you notice?', color: 'bg-rose-50' },
                  { emoji: '🌿', label: 'Energy & sleep', detail: 'How has your day been?', color: 'bg-teal-50' },
                  { emoji: '💜', label: 'Personal notes', detail: 'Anything you want to remember?', color: 'bg-plum-50' },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-4 rounded-2xl ${item.color} p-4`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                      {item.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {item.detail}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-stone-400" />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sand-200 p-4">
                <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                <p className="text-xs leading-5 text-stone-500">
                  Small check-ins can help you organize your own observations.
                  You choose what to record.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-lg sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
                <LockKeyhole className="h-4 w-4 text-teal-700" />
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-700">
                  Stored on your device
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  Local browser storage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-sand-200/80 bg-white/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Made for everyday wellbeing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything in one calmer space.
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
              Useful tools to help you record information, reflect on your
              experiences and prepare for care.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            
{features.map((feature, index) => (
  <ScrollReveal
    key={feature.title}
    delay={index * 120}
  >
    <Link
      to={feature.to}
      className="interactive-card group block h-full rounded-2xl border border-sand-200 bg-white p-6 sm:p-7"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color}`}
      >
        <feature.icon className="h-6 w-6" />
      </span>

      <h3 className="mt-5 text-lg font-semibold text-stone-800">
        {feature.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-stone-600">
        {feature.description}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-plum-600">
        Explore feature
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  </ScrollReveal>
))}

          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid items-center gap-8 rounded-[28px] bg-teal-50 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              Your information. Your choices.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              The app is designed to store your records in your browser rather
              than require a cloud account. You can export a backup or delete
              your local records. Browser storage is not encryption, so keep
              your device and exported files private.
            </p>
          </div>

          <Link
            to="/privacy"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 lg:self-center"
          >
            Privacy & data
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-stone-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-stone-700">
            <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
            HerHealth Companion
          </Link>
          <p>
            A personal organizer, not a diagnostic tool or a substitute for
            professional medical care.
          </p>
        </div>
      </footer>
    </div>
  );
}
