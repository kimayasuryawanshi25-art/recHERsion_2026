import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Globe, AlertCircle } from 'lucide-react';

interface VoiceDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmText: (text: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', flag: '🇮🇳' },
];

export function VoiceDiaryModal({ isOpen, onClose, onConfirmText }: VoiceDiaryModalProps) {
  const [selectedLang, setSelectedLang] = useState('en-AU');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission was denied. Please allow microphone access or type directly.');
        } else if (event.error !== 'no-speech') {
          setRecognitionError(`Speech recognition issue: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLang]);

  if (!isOpen) return null;

  const handleToggleRecord = () => {
    if (!recognitionRef.current) return;
    setRecognitionError(null);

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleConfirm = () => {
    if (transcript.trim()) {
      onConfirmText(transcript.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-sand-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
              <Mic className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Voice Journal Diary</h3>
              <p className="text-[11px] text-stone-500">Speak naturally in your preferred language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span className="text-xs font-semibold text-stone-700">Speech Language:</span>
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="rounded-xl border border-sand-300 bg-sand-50 px-2.5 py-1 text-xs text-stone-800 outline-none focus:border-plum-500"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Warning if Speech API is not supported */}
        {!isSupported && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Voice speech recognition is not supported in this browser. You can type your reflections directly into the review box below.
            </span>
          </div>
        )}

        {recognitionError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            {recognitionError}
          </div>
        )}

        {/* Record Control Area */}
        {isSupported && (
          <div className="flex flex-col items-center justify-center py-4 bg-sand-50/50 rounded-2xl border border-sand-200 space-y-3">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all shadow-md ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-plum-600 text-white hover:bg-plum-700'
              }`}
            >
              {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <p className="text-xs font-semibold text-stone-700">
              {isRecording ? 'Listening... Tap to pause recording' : 'Tap microphone to speak'}
            </p>
          </div>
        )}

        {/* Human-in-the-Loop Review Box */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
            <span>Review & Edit Transcription:</span>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-[11px] text-stone-400 hover:text-stone-700"
              >
                Clear
              </button>
            )}
          </label>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={4}
            placeholder="Your spoken words will appear here in real time. You can edit, add notes, or correct spelling before saving..."
            className="w-full rounded-xl border border-sand-300 p-3 text-xs outline-none focus:border-plum-500 leading-relaxed resize-none"
          />
          <p className="text-[11px] text-stone-400 italic mt-1">
            Always review voice transcriptions for accuracy before adding to your health record.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-sand-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!transcript.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Confirm & Populate Entry
          </button>
        </div>
      </div>
    </div>
  );
}
