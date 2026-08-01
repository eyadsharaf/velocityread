import { useReaderStore } from '../store/readerStore';

export default function RSVPControls() {
  const { isPlaying, setPlaying, wpm, userScrolledAway, setUserScrolledAway } = useReaderStore();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
      <button
        onClick={() => {
          if (userScrolledAway) {
            setUserScrolledAway(false);
          } else {
            setPlaying(!isPlaying);
          }
        }}
        className="w-12 h-12 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#333] flex items-center justify-center text-[#E0E0E0] transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
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
      <span className="text-[#888] text-sm tabular-nums">{wpm} WPM</span>
    </div>
  );
}
