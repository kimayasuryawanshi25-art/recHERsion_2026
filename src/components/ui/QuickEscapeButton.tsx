import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

function executeQuickEscape() {
  try {
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }
  window.location.replace('https://www.google.com');
}

export function QuickEscapeButton({ className = '' }: { className?: string }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        executeQuickEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <button
      type="button"
      onClick={executeQuickEscape}
      title="Quick Exit (Press Esc) — Immediately leaves this site and opens weather page"
      className={`inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:text-rose-800 ${className}`}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Quick Exit (Esc)</span>
    </button>
  );
}
