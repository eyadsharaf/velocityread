import { useReaderStore } from '../store/readerStore';

/**
 * Bare 44×44 tap targets inside a frosted pill — the container carries the
 * chrome (border/blur/shadow), buttons carry only press feedback (active:scale).
 */
const ctlBtn =
  'w-11 h-11 flex items-center justify-center rounded-full text-text-secondary hover:text-text transition-all duration-150 active:scale-92 select-none';

export default function RSVPControls() {
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
      setUserScrolledAway(false);
    } else {
      setPlaying(!isPlaying);
    }
  };

  // Touch path clamps tighter than the keyboard/store path (100–1000).
  const bump = (delta: number) => setWpm(Math.max(100, Math.min(1000, wpm + delta)));

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-elevated/90 backdrop-blur-md border border-border shadow-[0_4px_16px_rgba(0,0,0,0.35)] pl-1 pr-2 pointer-events-auto"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <button onClick={rewindSentence} className={ctlBtn} aria-label="Previous sentence">
        <span className="text-[22px] leading-none font-semibold" aria-hidden="true">
          ‹
        </span>
      </button>

      <button
        onClick={togglePlay}
        className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-150 active:scale-92 select-none"
        aria-label={userScrolledAway ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-accent"
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
            className="text-text-secondary"
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

      <button onClick={() => bump(-25)} className={ctlBtn} aria-label="Slower (−25 WPM)">
        <span className="text-lg leading-none font-medium" aria-hidden="true">
          −
        </span>
      </button>

      <span className="text-text text-ui tabular-nums tracking-wide font-medium min-w-[5rem] text-center select-none">
        {wpm} WPM
      </span>

      <button onClick={() => bump(25)} className={ctlBtn} aria-label="Faster (+25 WPM)">
        <span className="text-lg leading-none font-medium" aria-hidden="true">
          +
        </span>
      </button>
    </div>
  );
}
