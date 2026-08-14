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
  const [showControls, setShowControls] = useState(true);
  const [fadeTimer, setFadeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Keep the screen awake while playing
  useWakeLock(isPlaying);

  // Auto-fade controls after 3s
  useEffect(() => {
    if (fadeTimer) clearTimeout(fadeTimer);
    if (!isPlaying) {
      setShowControls(true);
      return;
    }
    const t = setTimeout(() => setShowControls(false), 3000);
    setFadeTimer(t);
    return () => clearTimeout(t);
  }, [isPlaying]);

  // Show controls on mouse movement or touch
  useEffect(() => {
    const onMove = () => {
      setShowControls(true);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (isPlaying) {
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
  }, [isPlaying, fadeTimer]);

  // Keyboard actions wake the controls too (same as mousemove/touchstart)
  useEffect(() => {
    if (!controlsWake) return;
    setShowControls(true);
    if (fadeTimer) clearTimeout(fadeTimer);
    if (isPlaying) {
      setFadeTimer(setTimeout(() => setShowControls(false), 3000));
    }
  }, [controlsWake]);

  if (!doc) return null;

  return (
    <div className="flex flex-col h-full w-full">
      <ProgressBar />
      {/* Top half - RSVP (padded below the notch) */}
      <div
        className="relative h-1/2 bg-base overflow-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <RSVPDisplay />
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
            <RSVPControls />
          </div>
        </div>
      </div>
      {/* Bottom half - Text */}
      <div className="h-1/2 bg-surface">
        <TextPanel />
      </div>
    </div>
  );
}
