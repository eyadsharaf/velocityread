import { useRef, useEffect, useCallback, useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import { useReaderStore } from '../store/readerStore';

/** How many paragraphs above and below the current one to render into the DOM. */
const PARAGRAPH_WINDOW = 12;

type ParagraphRowProps = {
  pIdx: number;
  words: string[];
  startIdx: number;
  isCurrent: boolean;
  isPastParagraph: boolean; // whole paragraph is before the current word
  currentWordIdx: number; // global index of the active word; -1 if none in this paragraph
  registerRef: (idx: number, el: HTMLDivElement | null) => void;
  onWordClick: (globalIdx: number) => void;
};

/**
 * One paragraph row — its sentences flow inline and wrap naturally, mirroring
 * the source file's structure instead of one visual block per sentence.
 * Memoized so it only re-renders when its own inputs change (active state /
 * current word within it) — not on every word-tick of the whole doc.
 */
const ParagraphRow = memo(function ParagraphRow({
  pIdx,
  words,
  startIdx,
  isCurrent,
  isPastParagraph,
  currentWordIdx,
  registerRef,
  onWordClick,
}: ParagraphRowProps) {
  return (
    <div
      ref={(el) => registerRef(pIdx, el)}
      className={`rounded-md px-5 py-2 transition-colors duration-200 ${
        isCurrent ? 'bg-row-active' : ''
      }`}
    >
      <p className="font-reader text-reader text-text-secondary text-left tracking-tight">
        {words.map((word, wIdx) => {
          const gIdx = startIdx + wIdx;
          const isCurrentWord = gIdx === currentWordIdx;
          const isPast = isPastParagraph || gIdx < currentWordIdx;
          return (
            <span key={wIdx}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(gIdx);
                }}
                className={`cursor-pointer transition-colors inline font-reader text-reader ${
                  isCurrentWord
                    ? 'text-text font-semibold'
                    : isPast
                    ? 'text-text-dim'
                    : 'text-text-secondary'
                }`}
              >
                {word}
              </span>
              {isCurrentWord && (
                <span className="caret-blink inline-block w-[2px] h-[1em] bg-accent ml-[1px] align-middle" />
              )}
              {' '}
            </span>
          );
        })}
      </p>
    </div>
  );
});

export default function TextPanel() {
  const {
    doc,
    currentIndex,
    isPlaying,
    setPlaying,
    setCurrentIndex,
    userScrolledAway,
    setUserScrolledAway,
  } = useReaderStore();
  const readerFont = useReaderStore((s) => s.settings.readerFont);

  const scrollRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const isAutoScrolling = useRef(false);
  const lastParagraphIndex = useRef(-1);

  const currentWord = doc?.words[currentIndex];
  const currentParagraphIdx = currentWord?.paragraphIndex ?? 0;

  // Derive stable per-paragraph data (start index + flat word list) from the
  // doc. useMemo (not an effect) so it's correct on first paint, and so the
  // arrays keep a stable identity across word-ticks — keeping ParagraphRow
  // memoization effective.
  const { paragraphStarts, paragraphWords } = useMemo(() => {
    const starts: number[] = [];
    const flat: string[][] = [];
    if (doc) {
      let lastP = -1;
      let acc: string[] = [];
      for (let i = 0; i < doc.words.length; i++) {
        const w = doc.words[i];
        if (w.paragraphIndex !== lastP) {
          if (acc.length > 0) flat.push(acc);
          acc = [];
          starts[w.paragraphIndex] = i;
          lastP = w.paragraphIndex;
        }
        acc.push(w.word);
      }
      if (acc.length > 0) flat.push(acc);
    }
    return { paragraphStarts: starts, paragraphWords: flat };
  }, [doc]);

  // Auto-scroll to center the current paragraph when it changes
  useEffect(() => {
    if (!doc || userScrolledAway) return;
    if (currentParagraphIdx === lastParagraphIndex.current) return;
    lastParagraphIndex.current = currentParagraphIdx;

    const el = paragraphRefs.current.get(currentParagraphIdx);
    if (!el || !scrollRef.current) return;

    isAutoScrolling.current = true;
    const container = scrollRef.current;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetScroll =
      container.scrollTop +
      (elRect.top - containerRect.top) -
      (containerRect.height / 2) +
      (elRect.height / 2);

    // Honor prefers-reduced-motion: jump instead of smooth-scroll.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top: targetScroll, behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 400);
  }, [currentParagraphIdx, doc, userScrolledAway]);

  // Detect user scroll away
  const handleScroll = useCallback(() => {
    if (!doc || isAutoScrolling.current) return;

    const el = paragraphRefs.current.get(currentParagraphIdx);
    if (!el || !scrollRef.current) return;

    const container = scrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elCenter = elRect.top + elRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const distance = Math.abs(elCenter - containerCenter);

    if (distance > containerRect.height / 2 + 20) {
      if (!userScrolledAway) {
        setUserScrolledAway(true);
        setPlaying(false);
      }
    }
  }, [doc, currentParagraphIdx, userScrolledAway, setUserScrolledAway, setPlaying]);

  // Handle click on word to jump
  const handleWordClick = useCallback(
    (globalIdx: number) => {
      setCurrentIndex(globalIdx);
      setUserScrolledAway(false);
    },
    [setCurrentIndex, setUserScrolledAway]
  );

  // Handle click in scroll area when scrolled away
  const handleContainerClick = useCallback(() => {
    if (userScrolledAway) {
      setUserScrolledAway(false);
    }
  }, [userScrolledAway, setUserScrolledAway]);

  // Stable ref registration callback
  const registerRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) {
      paragraphRefs.current.set(idx, el);
    } else {
      paragraphRefs.current.delete(idx);
    }
  }, []);

  if (!doc) return null;

  const totalParagraphs = doc.paragraphs.length;
  const winStart = Math.max(0, currentParagraphIdx - PARAGRAPH_WINDOW);
  const winEnd = Math.min(
    totalParagraphs,
    currentParagraphIdx + PARAGRAPH_WINDOW + 1
  );

  const rows: React.ReactNode[] = [];
  for (let pIdx = winStart; pIdx < winEnd; pIdx++) {
    const words = paragraphWords[pIdx];
    if (!words) continue;
    const startIdx = paragraphStarts[pIdx] ?? 0;
    const isCurrent = pIdx === currentParagraphIdx;
    // A paragraph fully before the active word is "past" (dim all its words).
    const isPastParagraph =
      !isCurrent && startIdx + words.length <= currentIndex;

    rows.push(
      <ParagraphRow
        key={pIdx}
        pIdx={pIdx}
        words={words}
        startIdx={startIdx}
        isCurrent={isCurrent}
        isPastParagraph={isPastParagraph}
        // Only the active paragraph needs the exact word; others get -1 so
        // their memoized rows never re-render on word-ticks within it.
        currentWordIdx={isCurrent ? currentIndex : -1}
        registerRef={registerRef}
        onWordClick={handleWordClick}
      />
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onClick={handleContainerClick}
      className="text-panel h-full overflow-y-auto bg-surface px-6 py-6 sm:px-16 sm:py-10"
      style={{ '--reader-font-size': `${readerFont}px` } as CSSProperties}
    >

      <div className="max-w-3xl mx-auto pb-[50vh] pt-[40vh] flex flex-col gap-3">{rows}</div>

    </div>
  );
}
