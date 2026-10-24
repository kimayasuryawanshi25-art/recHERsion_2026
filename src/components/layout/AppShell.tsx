import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Clock, BarChart3, FileText,
  Lock, GraduationCap, ShieldCheck, Menu, X, Plus, Heart, Eye, EyeOff,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/timeline', icon: Clock, label: 'Timeline & Insights' },
  { to: '/consultation', icon: FileText, label: 'Appointment Prep' },
  { to: '/preventive', icon: ShieldCheck, label: 'Preventive Care' },
  { to: '/learning', icon: GraduationCap, label: 'Learn' },
  { to: '/privacy', icon: Lock, label: 'Privacy & Data' },
];

interface Props {
  children: React.ReactNode;
  discreetMode: boolean;
  onToggleDiscreet: () => void;
}

export function AppShell({ children, discreetMode, onToggleDiscreet }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const appName = discreetMode ? 'Health Notes' : 'HerHealth Companion';

  const navLink = (item: typeof NAV[0], mobile = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={() => mobile && setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-plum-100 text-plum-700 shadow-sm'
            : 'text-gray-600 hover:bg-sand-200 hover:text-gray-800'
        }`
      }
      aria-label={item.label}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{discreetMode && item.label === 'Journal' ? 'Notes' : item.label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-sand-200 p-4 sticky top-0 h-screen no-print">
        <div className="flex items-center gap-2 px-4 py-3 mb-6">
          <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
          <span className="text-lg font-bold text-gray-800">{appName}</span>
        </div>

        <button
          onClick={() => navigate('/journal/new')}
          className="flex items-center justify-center gap-2 bg-plum-600 text-white rounded-xl px-4 py-2.5 mb-6 font-medium hover:bg-plum-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Check-in
        </button>

        <nav className="flex-1 flex flex-col gap-1" role="navigation" aria-label="Main navigation">
          {NAV.map(item => navLink(item))}
        </nav>

        <div className="border-t border-sand-200 pt-3 mt-3 space-y-2">
          <button
            onClick={onToggleDiscreet}
            className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full rounded-lg hover:bg-sand-100"
            aria-label={discreetMode ? 'Disable discreet mode' : 'Enable discreet mode'}
          >
            {discreetMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {discreetMode ? 'Discreet mode on' : 'Discreet mode'}
          </button>
          <p className="text-xs text-gray-400 px-4">Data stored locally in your browser</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-sand-200 px-4 py-3 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
            <span className="font-bold text-gray-800">{appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/journal/new')} className="bg-plum-600 text-white rounded-lg p-2" aria-label="New check-in">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600" aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
            <nav
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-4 pt-16 flex flex-col gap-1"
              role="navigation"
              aria-label="Mobile navigation"
              onClick={e => e.stopPropagation()}
            >
              {NAV.map(item => navLink(item, true))}
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
