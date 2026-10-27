import { useReaderStore } from '../store/readerStore';
import SettingsPopover from './SettingsPopover';

/**
 * Bare tap targets inside a frosted pill — the container carries the
 * chrome (border/blur/shadow), buttons carry only press feedback (active:scale).
 * Target sizes step down on narrow viewports so the full pill (transport +
 * speed + settings) fits 320px screens without overflow.
 */
const ctlBtn =
  'w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 min-[430px]:w-11 min-[430px]:h-11 flex items-center justify-center rounded-full text-text-secondary hover:text-text transition-all duration-150 active:scale-92 select-none';
const gearBtnOn =
  'w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 min-[430px]:w-11 min-[430px]:h-11 flex items-center justify-center rounded-full text-accent hover:text-accent-bright transition-all duration-150 active:scale-92 select-none';

type Props = {
  settingsOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RSVPControls({ settingsOpen, onOpenChange }: Props) {
  const {
    isPlaying,
    setPlaying,
    wpm,
    setWpm,
    rewindSentence,
    skipSentence,
    userScrolledAway,
    setUserScrolledAway,
  } = useReaderStore();

  const togglePlay = () => {
    if (userScrolledAway) {
      // Same behavior as the "Tap to resume" overlay: clear + resume.
      setUserScrolledAway(false);
      setPlaying(true);
    } else {
      setPlaying(!isPlaying);
    }
  };

  // Touch path clamps tighter than the keyboard/store path (100–1000).
  const bump = (delta: number) => setWpm(Math.max(100, Math.min(1000, wpm + delta)));

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-auto max-w-[calc(100vw-2rem)]"
      style={{ bottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative flex items-center gap-1 rounded-full bg-elevated/90 backdrop-blur-md border border-border shadow-[0_4px_16px_rgba(0,0,0,0.35)] pl-1 pr-1 min-[380px]:pr-2">
        {/* Transport: ‹ ⏯ › */}
        <div className="flex items-center gap-1">
          <button onClick={rewindSentence} className={ctlBtn} aria-label="Previous sentence">
            <span className="text-[22px] leading-none font-semibold" aria-hidden="true">
              ‹
            </span>
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center justify-center rounded-full transition-all duration-150 active:scale-92 select-none ${
              isPlaying
                ? 'w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 text-text-secondary hover:text-text'
                : 'w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 min-[430px]:w-12 min-[430px]:h-12 bg-accent text-white hover:bg-accent-bright'
            }`}
            aria-label={userScrolledAway ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button onClick={skipSentence} className={ctlBtn} aria-label="Next sentence">
            <span className="text-[22px] leading-none font-semibold" aria-hidden="true">
              ›
            </span>
          </button>
        </div>

        {/* Group dividers (hidden below 380px to save width) */}
        <div
          className="hidden min-[380px]:block w-px h-6 bg-border opacity-60 mx-1"
          aria-hidden="true"
        />

        {/* Speed: − WPM + */}
        <div className="flex items-center gap-1">
          <button onClick={() => bump(-25)} className={ctlBtn} aria-label="Slower (−25 WPM)">
            <span className="text-lg leading-none font-medium" aria-hidden="true">
              −
            </span>
          </button>

          <span className="text-text text-ui tabular-nums tracking-wide font-medium min-w-6 min-[430px]:min-w-[4rem] text-center select-none">
            <span key={wpm} className="inline-block wpm-pulse">
              {wpm}
              <span className="hidden min-[430px]:inline"> WPM</span>
            </span>
          </span>

          <button onClick={() => bump(25)} className={ctlBtn} aria-label="Faster (+25 WPM)">
            <span className="text-lg leading-none font-medium" aria-hidden="true">
              +
            </span>
          </button>
        </div>

        {/* Group divider */}
        <div
          className="hidden min-[380px]:block w-px h-6 bg-border opacity-60 mx-1"
          aria-hidden="true"
        />

        {/* Settings */}
        <button
          data-settings-toggle
          onClick={() => onOpenChange(!settingsOpen)}
          className={settingsOpen ? gearBtnOn : ctlBtn}
          aria-label="Settings"
          aria-expanded={settingsOpen}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {settingsOpen && <SettingsPopover onClose={() => onOpenChange(false)} />}

        {/* Keyboard hint — fades with the pill (same wrapper opacity transition).
            Hidden while settings is open (popover would overlap it on mobile). */}
        {!settingsOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none text-text-muted text-sm select-none">
            space play · ← → sentence · ↑ ↓ speed
          </div>
        )}
      </div>
    </div>
  );
}
