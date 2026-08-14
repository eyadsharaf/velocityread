import { useReaderStore } from '../store/readerStore';

export default function RSVPControls() {
  const { isPlaying, setPlaying, wpm, userScrolledAway, setUserScrolledAway } = useReaderStore();

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        onClick={() => {
          if (userScrolledAway) {
            setUserScrolledAway(false);
          } else {
            setPlaying(!isPlaying);
          }
        }}
        className="w-12 h-12 rounded-full bg-surface hover:bg-elevated border border-border flex items-center justify-center text-text transition-colors"
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
      <span className="text-text-muted text-sm font-mono tabular-nums tracking-wider">{wpm} WPM</span>
    </div>
  );
}
