import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { CSSProperties } from 'react';
import { useReaderStore } from '../store/readerStore';

/** Horizontal position (as a fraction of pane width) where the ORP char is anchored. */
const ORP_ANCHOR_RATIO = 0.42;

export default function RSVPDisplay() {
  const { doc, currentIndex, isPlaying, setPlaying, userScrolledAway, setUserScrolledAway } =
    useReaderStore();
  const rsvpScale = useReaderStore((s) => s.settings.rsvpScale);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const [anchorX, setAnchorX] = useState(0);
  const [orpOffset, setOrpOffset] = useState(0);

  // Calculate anchor position
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setAnchorX(containerRef.current.offsetWidth * ORP_ANCHOR_RATIO);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const word = doc?.words[currentIndex];

  // Measure ORP offset after render
  useLayoutEffect(() => {
    if (!word || !wordContainerRef.current) return;
    const container = wordContainerRef.current;
    const orpChar = container.querySelector('.orp-char') as HTMLElement | null;
    if (orpChar) {
      const containerRect = container.getBoundingClientRect();
      const orpRect = orpChar.getBoundingClientRect();
      setOrpOffset(orpRect.left - containerRect.left + orpRect.width / 2);
    } else {
      setOrpOffset(0);
    }
  }, [word, anchorX, rsvpScale]);

  if (!doc || doc.words.length === 0 || !word) return null;

  const chars = [...word.word];
  const orpIdx = word.orpIndex;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-start h-full overflow-hidden bg-base"
      onClick={() => {
        if (userScrolledAway) return;
        setPlaying(!isPlaying);
      }}
    >
      {/* Word display - shifted so ORP aligns with anchor.
          Tick marks live INSIDE the word container (bound to the ORP char) so
          they hug the word at every font-size tier instead of a fixed 64px gap. */}
      <div
        ref={wordContainerRef}
        className="absolute"
        style={
          {
            left: `${anchorX - orpOffset}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            '--rsvp-scale': rsvpScale,
          } as CSSProperties
        }
      >
        <span
          className="absolute w-[2px] h-3 bg-accent pointer-events-none"
          style={{
            left: `${orpOffset}px`,
            bottom: 'calc(100% + 8px)',
            transform: 'translateX(-50%)',
          }}
        />
        <span
          className="absolute w-[2px] h-3 bg-accent pointer-events-none"
          style={{
            left: `${orpOffset}px`,
            top: 'calc(100% + 8px)',
            transform: 'translateX(-50%)',
          }}
        />
        <span className="font-sans font-medium text-text text-rsvp leading-none whitespace-nowrap select-none">
          {chars.map((ch, i) => (
            <span
              key={i}
              className={i === orpIdx ? 'orp-char text-accent font-bold' : ''}
            >
              {ch}
            </span>
          ))}
        </span>
      </div>

      {/* "Tap to resume" overlay — tapping clears the flag AND resumes
          (matches the pill's play button). The parent onClick guard above
          still no-ops while scrolled away, so no double-toggle. */}
      {userScrolledAway && (
        <div
          role="button"
          aria-label="Resume"
          onClick={() => {
            setUserScrolledAway(false);
            setPlaying(true);
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-base/80 backdrop-blur-sm cursor-pointer select-none"
        >
          <span className="text-text-secondary text-xl">Tap to resume</span>
        </div>
      )}
    </div>
  );
}