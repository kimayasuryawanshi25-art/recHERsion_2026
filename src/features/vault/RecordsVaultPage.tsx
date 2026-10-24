import { useState, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  Trash2,
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getVaultRecords, saveVaultRecord, deleteVaultRecord } from '../../lib/db';

interface VaultRecord {
  id: string;
  title: string;
  date: string;
  category: 'imaging' | 'lab_result' | 'specialist_letter' | 'prescription' | 'other';
  facility?: string;
  notes?: string;
  fileName?: string;
  fileType?: string;
  fileData?: string; // base64 data url
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { key: 'all', label: 'All Records' },
  { key: 'lab_result', label: 'Pathology & Labs' },
  { key: 'imaging', label: 'Ultrasound & Imaging' },
  { key: 'specialist_letter', label: 'Specialist Letters' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'other', label: 'Other Documents' },
];

export function RecordsVaultPage() {
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<VaultRecord | null>(null);

  // New record form state
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'lab_result' as VaultRecord['category'],
    facility: '',
    notes: '',
  });
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    size: number;
    data: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await getVaultRecords();
        setRecords(loaded || []);
      } catch (err) {
        console.error('Failed to load records vault:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (5MB max for local IndexedDB safety)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB limit. Please select a smaller document or scan.');
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: VaultRecord = {
      id,
      title: form.title.trim(),
      date: form.date,
      category: form.category,
      facility: form.facility.trim() || undefined,
      notes: form.notes.trim() || undefined,
      fileName: attachedFile?.name,
      fileType: attachedFile?.type,
      fileSize: attachedFile?.size,
      fileData: attachedFile?.data,
    };

    await saveVaultRecord(newRecord);
    setRecords(prev => [newRecord, ...prev]);

    // Reset
    setShowAddModal(false);
    setForm({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      category: 'lab_result',
      facility: '',
      notes: '',
    });
    setAttachedFile(null);
  };

  const handleDelete = async (id: string) => {
    await deleteVaultRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    if (previewRecord?.id === id) {
      setPreviewRecord(null);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facility?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title="Records Vault"
        description="Encrypted, private local storage for your clinical reports, lab results, imaging scans, and doctor letters."
      />

      {/* Local Privacy Guarantee Banner */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
          <div className="text-xs text-teal-900 leading-relaxed">
            <span className="font-bold">Device-Only Storage: </span>
            All documents in your Records Vault are stored strictly inside your browser’s local IndexedDB. No files are ever sent to external cloud servers unless you explicitly sign in for multi-device sync with AES-256-GCM encryption.
          </div>
        </div>
      </div>

      {/* Action and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search records by title, doctor, facility..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-sand-300 bg-white pl-10 pr-4 py-2 text-xs outline-none focus:border-plum-500 shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-plum-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.key
                ? 'bg-plum-600 text-white font-semibold'
                : 'bg-white border border-sand-300 text-stone-700 hover:bg-sand-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Records List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-plum-600 border-t-transparent" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-stone-400">
            <FolderLock className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-sm">No records found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {records.length === 0
              ? 'Keep your medical records organized by uploading lab reports, ultrasound scans, or specialist referral letters.'
              : 'No records match your selected filter or search query.'}
          </p>
          {records.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white hover:bg-plum-700"
            >
              <Plus className="h-3.5 w-3.5" /> Upload First Record
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map(rec => (
            <div
              key={rec.id}
              className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-white p-5 shadow-sm hover:border-sand-300 transition"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-plum-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plum-700">
                    {CATEGORIES.find(c => c.key === rec.category)?.label || rec.category}
                  </span>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {rec.date}
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 text-sm leading-snug">{rec.title}</h4>

                {rec.facility && (
                  <p className="text-xs text-stone-600 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-stone-400" />
                    {rec.facility}
                  </p>
                )}

                {rec.notes && (
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{rec.notes}</p>
                )}

                {rec.fileName && (
                  <div className="flex items-center gap-2 rounded-xl bg-sand-50 p-2 text-xs text-stone-700 border border-sand-200">
                    <FileCheck className="h-4 w-4 text-teal-600 shrink-0" />
                    <span className="truncate flex-1 font-mono text-[11px]">{rec.fileName}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-sand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rec.fileData ? (
                    <button
                      type="button"
                      onClick={() => setPreviewRecord(rec)}
                      className="inline-flex items-center gap-1 rounded-lg bg-sand-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-sand-200 transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">Notes only</span>
                  )}

                  {rec.fileData && (
                    <a
                      href={rec.fileData}
                      download={rec.fileName || 'record'}
                      className="inline-flex items-center gap-1 rounded-lg border border-sand-200 px-2 py-1 text-xs text-stone-600 hover:bg-sand-50 transition"
                      title="Download document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(rec.id)}
                  className="text-stone-400 hover:text-rose-600 p-1"
                  title="Delete record"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-sand-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-stone-900 mb-1">Add Medical Record</h3>
            <p className="text-xs text-stone-500 mb-4">
              Stored securely on this device only.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Pelvic Ultrasound Report, FBC & Ferritin Results"
                  className="w-full rounded-xl border border-sand-300 p-2.5 text-xs outline-none focus:border-plum-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full rounded-xl border border-sand-300 p-2.5 text-xs outline-none focus:border-plum-500 bg-white"
                  >
                    <option value="lab_result">Pathology / Blood Test</option>
                    <option value="imaging">Ultrasound / Imaging</option>
                    <option value="specialist_letter">Specialist Letter</option>
                    <option value="prescription">Prescription</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Document Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-sand-300 p-2 text-xs outline-none focus:border-plum-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Doctor, Clinic, or Imaging Facility
                </label>
                <input
                  type="text"
                  value={form.facility}
                  onChange={e => setForm({ ...form, facility: e.target.value })}
                  placeholder="e.g. Dr. Jenkins / City Radiology Lab"
                  className="w-full rounded-xl border border-sand-300 p-2.5 text-xs outline-none focus:border-plum-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Key Findings or Doctor Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="e.g. Ferritin recorded at 18 ug/L. GP recommended oral iron tablets."
                  className="w-full rounded-xl border border-sand-300 p-2.5 text-xs outline-none focus:border-plum-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Attach File (PDF, Image - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-plum-50 file:text-plum-700 hover:file:bg-plum-100 cursor-pointer"
                />
                {uploadError && (
                  <p className="mt-1 text-xs text-rose-600">{uploadError}</p>
                )}
                {attachedFile && (
                  <p className="mt-1 text-[11px] text-teal-700 font-medium">
                    Attached: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-sand-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="rounded-xl bg-plum-600 px-5 py-2 text-xs font-semibold text-white hover:bg-plum-700 transition disabled:opacity-50"
                >
                  Save to Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-sand-200 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPreviewRecord(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-plum-700 bg-plum-50 px-2 py-0.5 rounded">
                {previewRecord.category}
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-1">{previewRecord.title}</h3>
              <p className="text-xs text-stone-500">
                {previewRecord.date} {previewRecord.facility && `· ${previewRecord.facility}`}
              </p>
            </div>

            {previewRecord.notes && (
              <div className="mb-4 rounded-xl bg-sand-50 p-3 text-xs text-stone-700 border border-sand-200">
                <span className="font-semibold block mb-0.5">Notes:</span>
                {previewRecord.notes}
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-xl border border-sand-200 bg-stone-50 p-2 flex items-center justify-center min-h-[250px]">
              {previewRecord.fileData?.startsWith('data:image/') ? (
                <img
                  src={previewRecord.fileData}
                  alt={previewRecord.title}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : previewRecord.fileData?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewRecord.fileData}
                  title={previewRecord.title}
                  className="w-full h-[400px] rounded"
                />
              ) : (
                <div className="text-center p-6 text-xs text-stone-500">
                  <FileText className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                  <p>File preview not supported inline.</p>
                  {previewRecord.fileData && (
                    <a
                      href={previewRecord.fileData}
                      download={previewRecord.fileName || 'record'}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-plum-600 px-4 py-2 text-xs font-semibold text-white hover:bg-plum-700"
                    >
                      <Download className="h-3.5 w-3.5" /> Download File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
