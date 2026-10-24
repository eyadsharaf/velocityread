import { useState, useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';
import { useRSVP } from '../hooks/useRSVP';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useWakeLock } from '../hooks/useWakeLock';
import RSVPDisplay from './RSVPDisplay';
import RSVPControls from './RSVPControls';
import TextPanel from './TextPanel';
import ProgressBar from './ProgressBar';

export default function Reader() {
  useRSVP();
  useKeyboardShortcuts();
  const { isPlaying, doc } = useReaderStore();
  const controlsWake = useReaderStore((s) => s.controlsWake);
  const focusMode = useReaderStore((s) => s.settings.focusMode);
  const reset = useReaderStore((s) => s.reset);
  const [showControls, setShowControls] = useState(true);
  const [fadeTimer, setFadeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  // Settings popover open state lives here: while open, controls never fade.
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keep the screen awake while playing
  useWakeLock(isPlaying);

  // Auto-fade controls after 3s (never while paused or the settings popover is open)
  useEffect(() => {
    if (fadeTimer) clearTimeout(fadeTimer);
    if (!isPlaying || settingsOpen) {
      setShowControls(true);
      return;
    }
    const t = setTimeout(() => setShowControls(false), 3000);
    setFadeTimer(t);
    return () => clearTimeout(t);
  }, [isPlaying, settingsOpen]);

  // Show controls on mouse movement or touch
  useEffect(() => {
    const onMove = () => {
      setShowControls(true);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (isPlaying && !settingsOpen) {
        const t = setTimeout(() => setShowControls(false), 3000);
        setFadeTimer(t);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onMove);
    };
  }, [isPlaying, fadeTimer, settingsOpen]);

  // Keyboard actions wake the controls too (same as mousemove/touchstart)
  useEffect(() => {
    if (!controlsWake) return;
    setShowControls(true);
    if (fadeTimer) clearTimeout(fadeTimer);
    if (isPlaying && !settingsOpen) {
      setFadeTimer(setTimeout(() => setShowControls(false), 3000));
    }
  }, [controlsWake]);

  if (!doc) return null;

  return (
    <div className="flex flex-col h-full w-full">
      <ProgressBar />
      {/* RSVP pane — flex basis ~50%, full height in focus mode.
          min-h protects word + ticks + pill on short/landscape screens. */}
      <div
        className={`relative bg-base overflow-hidden transition-colors duration-150 min-h-[240px] ${
          focusMode ? 'flex-1' : 'basis-1/2'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <RSVPDisplay />
        {/* z-20 keeps the pill clickable above the z-10 "Tap to resume" overlay */}
        <div
          className={`absolute inset-0 z-20 pointer-events-none controls-fade ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
            <RSVPControls settingsOpen={settingsOpen} onOpenChange={setSettingsOpen} />
          </div>
        </div>
      </div>
      {/* Text pane — collapsed in focus mode */}
      {!focusMode && (
        <div className="flex-1 min-h-[160px] bg-surface transition-colors duration-150">
          <TextPanel />
        </div>
      )}
    </div>
  );
}
