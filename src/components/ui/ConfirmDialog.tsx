import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'info' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertTriangle : variant === 'info' ? Info : CheckCircle;
  const color = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-plum-600 hover:bg-plum-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 shrink-0 ${variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-plum-500'}`} />
          <div className="flex-1">
            <h3 id="dialog-title" className="font-semibold text-gray-900 text-lg">{title}</h3>
            <p className="text-gray-600 mt-2 text-sm">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${color}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
