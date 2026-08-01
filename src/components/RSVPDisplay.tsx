import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useReaderStore } from '../store/readerStore';

export default function RSVPDisplay() {
  const { doc, currentIndex, isPlaying, setPlaying, userScrolledAway } = useReaderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const [anchorX, setAnchorX] = useState(0);
  const [orpOffset, setOrpOffset] = useState(0);

  // Calculate anchor position
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setAnchorX(containerRef.current.offsetWidth * 0.42);
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
  }, [word, anchorX]);

  if (!doc || doc.words.length === 0 || !word) return null;

  const chars = [...word.word];
  const orpIdx = word.orpIndex;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-start h-full overflow-hidden bg-[#121212]"
      onClick={() => {
        if (userScrolledAway) return;
        setPlaying(!isPlaying);
      }}
    >
      {/* Tick marks at anchor position */}
      <div
        className="absolute pointer-events-none"
        style={{ left: `${anchorX}px`, top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="absolute -top-16 w-[2px] h-3 bg-[#FF3B30]" />
        <div className="absolute top-16 w-[2px] h-3 bg-[#FF3B30]" />
      </div>

      {/* Word display - shifted so ORP aligns with anchor */}
      <div
        ref={wordContainerRef}
        className="absolute"
        style={{
          left: `${anchorX - orpOffset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <span
          className="text-[56px] leading-none whitespace-nowrap select-none"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#E0E0E0' }}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              className={i === orpIdx ? 'orp-char' : ''}
              style={
                i === orpIdx
                  ? { color: '#FF3B30', fontWeight: 700 }
                  : undefined
              }
            >
              {ch}
            </span>
          ))}
        </span>
      </div>

      {/* "Tap to resume" overlay */}
      {userScrolledAway && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#121212]/80 z-10">
          <span className="text-[#888] text-lg">Tap to resume</span>
        </div>
      )}
    </div>
  );
}
