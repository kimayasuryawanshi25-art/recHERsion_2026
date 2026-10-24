import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { pinLockService } from '../../lib/safety/pinLock';

interface PinLockModalProps {
  isLocked: boolean;
  onUnlocked: () => void;
}

export function PinLockModal({ isLocked, onUnlocked }: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) return;

    setVerifying(true);
    const success = await pinLockService.unlock(pin);
    setVerifying(false);

    if (success) {
      setPin('');
      setError(false);
      onUnlocked();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sand-100/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-sand-200 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-plum-100 text-plum-700">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold text-stone-900">App Locked</h2>
        <p className="mt-1 text-xs text-stone-500">Enter your security PIN to access your health journal</p>

        {/* PIN Dots Display */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'border-plum-600 bg-plum-600 scale-110'
                  : 'border-sand-300 bg-sand-100'
              } ${error ? 'border-rose-500 bg-rose-500' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-xs font-semibold text-rose-600 flex items-center justify-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Incorrect PIN. Please try again.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="flex h-12 items-center justify-center rounded-2xl bg-sand-50 text-lg font-bold text-stone-800 transition hover:bg-sand-100 active:scale-95 border border-sand-200"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="flex h-12 items-center justify-center rounded-2xl bg-sand-50 text-xs font-semibold text-stone-500 hover:bg-sand-100 active:scale-95 border border-sand-200"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="flex h-12 items-center justify-center rounded-2xl bg-sand-50 text-lg font-bold text-stone-800 hover:bg-sand-100 active:scale-95 border border-sand-200"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleUnlock()}
            disabled={pin.length < 4 || verifying}
            className="flex h-12 items-center justify-center rounded-2xl bg-plum-600 text-xs font-bold text-white hover:bg-plum-700 active:scale-95 disabled:opacity-40 transition"
          >
            {verifying ? '...' : 'Unlock'}
          </button>
        </div>

        <p className="text-[11px] text-stone-400">
          Protected with WebCrypto PBKDF2/SHA-256 encryption.
        </p>
      </div>
    </div>
  );
}
