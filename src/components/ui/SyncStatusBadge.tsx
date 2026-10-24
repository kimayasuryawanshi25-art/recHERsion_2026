import { useState, useEffect } from 'react';
import { RefreshCw, Check, WifiOff, HardDrive } from 'lucide-react';
import { syncManager, type SyncStatus } from '../../lib/sync/syncWorker';

interface SyncStatusBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function SyncStatusBadge({ onClick, className = '' }: SyncStatusBadgeProps) {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [userEmail, setUserEmail] = useState<string | null>(syncManager.getUserEmail());

  useEffect(() => {
    syncManager.init().catch(() => {});
    const unsubscribe = syncManager.subscribe((newStatus, email) => {
      setStatus(newStatus);
      setUserEmail(email ?? null);
    });
    return unsubscribe;
  }, []);

  const handleClick = () => {
    if (status === 'synced' || status === 'error') {
      syncManager.syncNow().catch(() => {});
    }
    onClick?.();
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 animate-spin text-plum-600" />,
          label: 'Syncing...',
          classes: 'bg-plum-50 border-plum-200 text-plum-700',
        };
      case 'synced':
        return {
          icon: <Check className="h-3.5 w-3.5 text-teal-600" />,
          label: userEmail ? `Synced (${userEmail.split('@')[0]})` : 'Synced',
          classes: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100',
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-3.5 w-3.5 text-amber-600" />,
          label: 'Offline (Local)',
          classes: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      case 'error':
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 text-rose-500" />,
          label: 'Sync retry',
          classes: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
        };
      case 'local_only':
      default:
        return {
          icon: <HardDrive className="h-3.5 w-3.5 text-stone-500" />,
          label: 'Local only',
          classes: 'bg-sand-100 border-sand-200 text-stone-600 hover:bg-sand-200 hover:text-stone-900',
        };
    }
  };

  const { icon, label, classes } = getStatusDisplay();

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        status === 'local_only'
          ? 'Data is stored only in this browser. Click to enable optional cloud sync.'
          : `Sync status: ${status}. Click to sync now or manage account.`
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${classes} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
