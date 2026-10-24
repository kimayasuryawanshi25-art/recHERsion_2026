
import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  FileText,
  LockKeyhole,
  GraduationCap,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Heart,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
  Leaf,
  AlertOctagon,
} from 'lucide-react';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { AuthModal } from '../../features/auth/AuthModal';
import { UrgentCarePanel } from '../ui/UrgentCarePanel';
import { PinLockModal } from '../ui/PinLockModal';
import { QuickEscapeButton } from '../ui/QuickEscapeButton';
import { pinLockService } from '../../lib/safety/pinLock';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/timeline', icon: Clock, label: 'Timeline & Insights' },
  { to: '/consultation', icon: FileText, label: 'Appointment Prep' },
  { to: '/preventive', icon: ShieldCheck, label: 'Preventive Care' },
  { to: '/learning', icon: GraduationCap, label: 'Learn' },
  { to: '/privacy', icon: LockKeyhole, label: 'Privacy & Data' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface Props {
  children: React.ReactNode;
  discreetMode: boolean;
  onToggleDiscreet: () => void;
}

export function AppShell({
  children,
  discreetMode,
  onToggleDiscreet,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [urgentCareOpen, setUrgentCareOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const recordActivity = () => pinLockService.recordUserActivity();
    window.addEventListener('mousemove', recordActivity);
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('touchstart', recordActivity);
    window.addEventListener('scroll', recordActivity);

    const timer = setInterval(async () => {
      const shouldLock = await pinLockService.checkInactivityTimeout();
      if (shouldLock) setIsLocked(true);
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('scroll', recordActivity);
      clearInterval(timer);
    };
  }, []);

  const appName = discreetMode ? 'Health Notes' : 'HerHealth Companion';

  const navLink = (item: (typeof NAV)[number], mobile = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={() => mobile && setMobileOpen(false)}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
          isActive
            ? 'bg-plum-100 text-plum-700 font-semibold'
            : 'text-stone-600 hover:bg-sand-100 hover:text-stone-900'
        }`
      }
      aria-label={item.label}
    >
      <item.icon className="h-[19px] w-[19px] shrink-0" />
      <span className="min-w-0 flex-1">
        {discreetMode && item.label === 'Journal' ? 'Notes' : item.label}
      </span>
      <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-sand-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-sand-200 bg-white px-4 py-5 md:flex">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-3 rounded-xl px-2 py-2 text-left"
          aria-label="Go to overview"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100">
            <Heart className="h-6 w-6 text-rose-600" fill="currentColor" />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight text-stone-800">
              {appName}
            </span>
            <span className="mt-0.5 block text-xs text-stone-400">
              Your personal health space
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/journal/new')}
          className="mb-7 flex w-full items-center justify-center gap-2 rounded-xl bg-plum-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-plum-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New check-in
        </button>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          Your health space
        </p>

        <nav
          className="flex flex-1 flex-col gap-1"
          aria-label="Main navigation"
        >
          {NAV.map(item => navLink(item))}
        </nav>

        <div className="mt-5 border-t border-sand-200 pt-4">
          <button
            type="button"
            onClick={onToggleDiscreet}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-sand-100"
            aria-label={discreetMode ? 'Disable discreet mode' : 'Enable discreet mode'}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-stone-600">
              {discreetMode ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-700">
                Discreet mode
              </span>
              <span className="block text-xs text-stone-400">
                {discreetMode ? 'Currently enabled' : 'Hide sensitive labels'}
              </span>
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                discreetMode ? 'bg-teal-500' : 'bg-stone-300'
              }`}
            />
          </button>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-teal-50 p-3">
            <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <p className="text-[11px] leading-relaxed text-stone-600">
              Your information stays in this browser. Nothing is uploaded to a
              cloud account by this app.
            </p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex min-w-0 items-center gap-2"
            aria-label="Go to overview"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" fill="currentColor" />
            </span>
            <span className="truncate text-sm font-bold text-stone-800">
              {appName}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <SyncStatusBadge onClick={() => setAuthModalOpen(true)} className="scale-90" />
            <button
              type="button"
              onClick={() => navigate('/journal/new')}
              className="rounded-xl bg-plum-600 p-2.5 text-white transition hover:bg-plum-700"
              aria-label="New check-in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(open => !open)}
              className="rounded-xl p-2.5 text-stone-600 hover:bg-sand-100"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div
            className="no-print fixed inset-0 z-40 bg-stone-950/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <nav
              className="absolute right-0 top-0 flex h-full w-[min(320px,88vw)] flex-col gap-1 overflow-y-auto bg-white p-4 pt-20 shadow-2xl"
              aria-label="Mobile navigation"
              onClick={event => event.stopPropagation()}
            >
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Menu
              </p>
              {NAV.map(item => navLink(item, true))}
              <div className="mt-4 rounded-xl bg-teal-50 p-3 text-xs leading-relaxed text-stone-600">
                Your health information is stored locally in this browser.
              </div>
            </nav>
          </div>
        )}

        {/* Page header */}
        <div className="no-print hidden items-center justify-between border-b border-sand-200/80 bg-sand-50/90 px-8 py-4 lg:flex">
          <div>
            <p className="text-xs text-stone-400">
              HerHealth Companion <span className="mx-1">/</span>{' '}
              {NAV.find(item =>
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              )?.label ?? 'Health space'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <QuickEscapeButton />
            <button
              type="button"
              onClick={() => setUrgentCareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Urgent Care</span>
            </button>
            <SyncStatusBadge onClick={() => setAuthModalOpen(true)} />
            <button
              type="button"
              onClick={onToggleDiscreet}
              className="flex items-center gap-2 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-plum-200 hover:text-plum-700"
            >
              {discreetMode ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {discreetMode ? 'Discreet mode on' : 'Discreet mode'}
            </button>
          </div>
        </div>

        <main className="page-enter mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 md:p-8 xl:px-10">
          {children}
        </main>

        <footer className="hidden items-center justify-between border-t border-sand-200/70 px-8 py-4 text-xs text-stone-400 md:flex">
          <span>Take it one day at a time.</span>
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5" />
            Stored on this device
          </span>
        </footer>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <UrgentCarePanel
        isOpen={urgentCareOpen}
        onClose={() => setUrgentCareOpen(false)}
      />
      <PinLockModal
        isLocked={isLocked}
        onUnlocked={() => setIsLocked(false)}
      />
    </div>
  );
}
