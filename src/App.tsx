import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { OverviewPage } from './features/overview/OverviewPage';
import { JournalPage } from './features/journal/JournalPage';
import { EntryForm } from './features/journal/EntryForm';
import { TimelinePage } from './features/timeline/TimelinePage';
import { ConsultationPage } from './features/consultation/ConsultationPage';
import { PreventivePage } from './features/preventive/PreventivePage';
import { LearningPage } from './features/learning/LearningPage';
import { PrivacyPage } from './features/privacy/PrivacyPage';
import { getSettings, saveSettings } from './lib/db';
import type { UserSettings } from './types/health';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [discreetMode, setDiscreetMode] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s || null);
      setDiscreetMode(s?.discreetMode || false);
      setLoading(false);
    })();
  }, []);

  // Re-check settings on navigation (simple approach)
  useEffect(() => {
    const check = async () => {
      const s = await getSettings();
      setSettings(s || null);
    };
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleDiscreet = async () => {
    const next = !discreetMode;
    setDiscreetMode(next);
    if (settings) {
      const updated = { ...settings, discreetMode: next, updatedAt: new Date().toISOString() };
      await saveSettings(updated);
      setSettings(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-plum-200 border-t-plum-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const onboarded = settings?.onboardingComplete;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/*"
          element={
            !onboarded ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <AppShell discreetMode={discreetMode} onToggleDiscreet={toggleDiscreet}>
                <Routes>
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/journal" element={<JournalPage />} />
                  <Route path="/journal/new" element={<EntryForm />} />
                  <Route path="/journal/edit/:id" element={<EntryForm editMode />} />
                  <Route path="/timeline" element={<TimelinePage />} />
                  <Route path="/consultation" element={<ConsultationPage />} />
                  <Route path="/preventive" element={<PreventivePage />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AppShell>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
