
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './features/home/HomePage';
import { OverviewPage } from './features/overview/OverviewPage';
import { JournalPage } from './features/journal/JournalPage';
import { EntryForm } from './features/journal/EntryForm';
import { TimelinePage } from './features/timeline/TimelinePage';
import { ConsultationPage } from './features/consultation/ConsultationPage';
import { PreventivePage } from './features/preventive/PreventivePage';
import { LearningPage } from './features/learning/LearningPage';
import { PrivacyPage } from './features/privacy/PrivacyPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { getSettings, saveSettings } from './lib/db';
import type { UserSettings } from './types/health';
<<<<<<< HEAD
import { SettingsPage } from './features/settings/SettingsPage';
import { PublicSharePage } from './features/consultation/PublicSharePage';
=======
>>>>>>> 8836c519b8675b886f9339a0c4b2cc43bbc6a054

export default function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [discreetMode, setDiscreetMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await getSettings();
        setSettings(s || null);
        setDiscreetMode(s?.discreetMode || false);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  // Refresh settings if they change elsewhere in the app.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const s = await getSettings();
        setSettings(s || null);
        setDiscreetMode(s?.discreetMode || false);
      } catch (error) {
        console.error('Failed to refresh settings:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleDiscreet = async () => {
    const next = !discreetMode;
    setDiscreetMode(next);

    if (settings) {
      const updated = {
        ...settings,
        discreetMode: next,
        updatedAt: new Date().toISOString(),
      };

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

  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/s/:token" element={<PublicSharePage />} />
=======
        <Route path="/" element={<HomePage />} />

        <Route
          path="/onboarding"
          element={<Navigate to="/overview" replace />}
        />

>>>>>>> 8836c519b8675b886f9339a0c4b2cc43bbc6a054
        <Route
          path="/*"
          element={
            <AppShell
              discreetMode={discreetMode}
              onToggleDiscreet={toggleDiscreet}
            >
              <Routes>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/journal/new" element={<EntryForm />} />
                <Route
                  path="/journal/edit/:id"
                  element={<EntryForm editMode />}
                />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route
                  path="/consultation"
                  element={<ConsultationPage />}
                />
                <Route path="/preventive" element={<PreventivePage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="*"
                  element={<Navigate to="/overview" replace />}
                />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
  