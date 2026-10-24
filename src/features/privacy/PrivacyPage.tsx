import { useState, useRef } from 'react';
import { Lock, Download, Upload, Trash2, Shield, HardDrive, AlertTriangle,} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { exportAllData, importData, deleteAllData, saveSettings } from '../../lib/db';
import type { ExportData } from '../../types/health';
import { getDemoEntries, getDemoSettings } from '../../data/demo-data';
import { saveEntry } from '../../lib/db';

export function PrivacyPage() {
  const [toast, setToast] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<ExportData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `herhealth-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Data exported successfully');
    } catch (e) {
      notify('Export failed: ' + (e as Error).message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text) as ExportData;
        // Validate
        if (!data.schemaVersion || !data.appName) {
          setImportResult('Invalid file: missing schema version or app name.');
          return;
        }
        if (!Array.isArray(data.symptomEntries)) {
          setImportResult('Invalid file: symptomEntries must be an array.');
          return;
        }
        // Sanitize — don't execute any code from imported data
        setPendingFile(data);
        setShowImportConfirm(true);
      } catch (err) {
        setImportResult('Failed to parse file. Please select a valid JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    try {
      const result = await importData(pendingFile, importMode);
      setImportResult(`Import complete: ${result.imported} records imported, ${result.skipped} skipped.${result.errors.length > 0 ? ' Errors: ' + result.errors.join('; ') : ''}`);
    } catch (e) {
      setImportResult('Import failed: ' + (e as Error).message);
    }
    setImporting(false);
    setPendingFile(null);
    setShowImportConfirm(false);
  };

  const handleDeleteAll = async () => {
    await deleteAllData();
    notify('All data deleted');
  };

  const handleLoadDemo = async () => {
    const entries = getDemoEntries();
    for (const e of entries) await saveEntry(e);
    const settings = getDemoSettings();
    await saveSettings(settings);
    notify('Demo data loaded (Maya, fictional)');
  };

  return (
    <div>
      <PageHeader title="Privacy & Data Controls" description="Your data stays on your device" />

      {/* Privacy info */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-plum-500" /> How Your Data Is Stored</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-plum-400 mt-0.5 shrink-0" />
            <p><strong>Local storage only.</strong> All your health records are stored in your browser's IndexedDB. No data is sent to external servers.</p>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-plum-400 mt-0.5 shrink-0" />
            <p><strong>No account required.</strong> This app works entirely in your browser without sign-up or login.</p>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p><strong>Limitations to be aware of:</strong></p>
              <ul className="list-disc ml-5 mt-1 text-xs text-gray-500 space-y-1">
                <li>Browser IndexedDB is not encrypted. Anyone with access to this browser profile could potentially access your data.</li>
                <li>Clearing browser data or uninstalling the browser will delete your records.</li>
                <li>Deleting data within this app does not delete previously exported files or screenshots.</li>
                <li>This app does not include advertising, third-party analytics, or automatic data sharing.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Export Your Data</h3>
        <p className="text-sm text-gray-500 mb-4">Download all your records as a JSON file. This file can be re-imported later.</p>
        <button onClick={handleExport} className="inline-flex items-center gap-2 bg-plum-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-plum-700 transition-colors text-sm">
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {/* Import */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Import Data</h3>
        <p className="text-sm text-gray-500 mb-4">Restore from a previously exported JSON file.</p>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} name="importMode" />
            Merge (keep existing, add new)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} name="importMode" />
            Replace (delete existing first)
          </label>
        </div>
        <input type="file" accept=".json" ref={fileRef} onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 bg-white border border-sand-300 text-gray-700 rounded-xl px-5 py-2.5 font-medium hover:bg-sand-50 transition-colors text-sm">
          <Upload className="w-4 h-4" /> Select File
        </button>
        {importResult && <p className="text-sm mt-3 text-gray-600 bg-sand-100 rounded-lg p-3">{importResult}</p>}
      </div>

      {/* Demo data */}
      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Load Demo Data</h3>
        <p className="text-sm text-gray-500 mb-4">Load fictional sample data (Maya, age 44) for demonstration purposes. All demo data is synthetic.</p>
        <button onClick={handleLoadDemo} className="inline-flex items-center gap-2 bg-teal-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-teal-700 transition-colors text-sm">
          Load Demo Data
        </button>
      </div>

      {/* Delete all */}
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete All Data</h3>
        <p className="text-sm text-gray-500 mb-4">Permanently remove all records, settings, and consultation summaries from this device. This cannot be undone.</p>
        <button onClick={() => setShowDeleteAll(true)} className="inline-flex items-center gap-2 bg-red-600 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-red-700 transition-colors text-sm">
          <Trash2 className="w-4 h-4" /> Delete All Data
        </button>
      </div>

      <ConfirmDialog open={showDeleteAll} onClose={() => setShowDeleteAll(false)} onConfirm={handleDeleteAll}
        title="Delete All Data?" message="This will permanently remove ALL your health records, settings, and summaries. Export your data first if you want to keep a backup. This action cannot be undone."
        confirmLabel="Delete Everything" variant="danger" />

      <ConfirmDialog open={showImportConfirm} onClose={() => { setShowImportConfirm(false); setPendingFile(null); }} onConfirm={confirmImport}
        title={importMode === 'replace' ? 'Replace all data?' : 'Import data?'}
        message={importMode === 'replace' ? 'This will delete all existing data and replace it with the imported file. Are you sure?' : `This will merge imported records with your existing data. Duplicate IDs will be skipped. Found ${pendingFile?.symptomEntries?.length || 0} entries to import.`}
        confirmLabel={importing ? 'Importing...' : 'Import'} variant={importMode === 'replace' ? 'warning' : 'info'} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
