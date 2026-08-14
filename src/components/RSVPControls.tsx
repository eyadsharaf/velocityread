import { useReaderStore } from '../store/readerStore';

const ctlBtn =
  'w-11 h-11 rounded-full bg-surface hover:bg-elevated border border-border flex items-center justify-center text-text transition-colors active:bg-elevated';

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
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <button onClick={rewindSentence} className={ctlBtn} aria-label="Previous sentence">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={togglePlay}
        className="w-12 h-12 rounded-full bg-surface hover:bg-elevated border border-border flex items-center justify-center text-text transition-colors active:bg-elevated"
        aria-label={userScrolledAway ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button onClick={skipSentence} className={ctlBtn} aria-label="Next sentence">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button onClick={() => bump(-25)} className={ctlBtn} aria-label="Slower (−25 WPM)">
        <span className="text-lg leading-none font-medium">−</span>
      </button>

      <span className="text-text-muted text-sm font-mono tabular-nums tracking-wider min-w-[5.5rem] text-center select-none">
        {wpm} WPM
      </span>

      <button onClick={() => bump(25)} className={ctlBtn} aria-label="Faster (+25 WPM)">
        <span className="text-lg leading-none font-medium">+</span>
      </button>
    </div>
  );
}
