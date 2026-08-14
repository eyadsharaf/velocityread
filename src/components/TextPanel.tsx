import { useRef, useEffect, useCallback, memo } from 'react';
import { useReaderStore } from '../store/readerStore';

/** How many sentences above and below the current one to render into the DOM. */
const SENTENCE_WINDOW = 50;

type SentenceRowProps = {
  sIdx: number;
  sentence: string[];
  startIdx: number;
  isCurrent: boolean;
  currentWordInSentence: number; // -1 if none
  isPastSentence: boolean; // whole sentence is before the current word
  startsNewPara: boolean;
  registerRef: (idx: number, el: HTMLDivElement | null) => void;
  onWordClick: (globalIdx: number) => void;
};

/**
 * One sentence row. Memoized so it only re-renders when its own inputs change
 * (active state / current word within it) — not on every word-tick of the whole doc.
 */
const SentenceRow = memo(function SentenceRow({
  sIdx,
  sentence,
  startIdx,
  isCurrent,
  currentWordInSentence,
  isPastSentence,
  startsNewPara,
  registerRef,
  onWordClick,
}: SentenceRowProps) {
  return (
    <div
      ref={(el) => registerRef(sIdx, el)}
      className={`rounded-md px-5 py-3 transition-colors duration-200 ${
        isCurrent ? 'bg-white/5' : ''
      }`}
      style={startsNewPara ? { marginTop: '28px' } : undefined}
    >
      <p className="font-reader text-reader text-text-secondary text-left leading-relaxed tracking-tight">
        {sentence.map((word, wIdx) => {
          const gIdx = startIdx + wIdx;
          const isCurrentWord = wIdx === currentWordInSentence;
          const isPast = isPastSentence || gIdx < startIdx + currentWordInSentence;
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
                <span className="caret-blink inline-block w-[2px] h-[18px] bg-accent ml-[1px] align-middle" />
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const isAutoScrolling = useRef(false);
  const lastSentenceIndex = useRef(-1);

  const currentWord = doc?.words[currentIndex];
  const currentSentenceIdx = currentWord?.sentenceIndex ?? 0;

  // Build a map from sentence index to starting global word index
  const sentenceStartMap = useRef<number[]>([]);
  useEffect(() => {
    if (!doc) return;
    const map: number[] = [];
    for (let i = 0; i < doc.words.length; i++) {
      const w = doc.words[i];
      if (w.wordIndexInSentence === 0) {
        map[w.sentenceIndex] = i;
      }
    }
    sentenceStartMap.current = map;
  }, [doc]);

  // Auto-scroll to center current sentence when it changes
  useEffect(() => {
    if (!doc || userScrolledAway) return;
    if (currentSentenceIdx === lastSentenceIndex.current) return;
    lastSentenceIndex.current = currentSentenceIdx;

    const el = sentenceRefs.current.get(currentSentenceIdx);
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

    container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 400);
  }, [currentSentenceIdx, doc, userScrolledAway]);

  // Detect user scroll away
  const handleScroll = useCallback(() => {
    if (!doc || isAutoScrolling.current) return;

    const el = sentenceRefs.current.get(currentSentenceIdx);
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
  }, [doc, currentSentenceIdx, userScrolledAway, setUserScrolledAway, setPlaying]);

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
      sentenceRefs.current.set(idx, el);
    } else {
      sentenceRefs.current.delete(idx);
    }
  }, []);

  if (!doc) return null;

  const totalSentences = doc.sentences.length;
  const winStart = Math.max(0, currentSentenceIdx - SENTENCE_WINDOW);
  const winEnd = Math.min(totalSentences, currentSentenceIdx + SENTENCE_WINDOW + 1);

  // Word offset of the active word within its own sentence (for highlight).
  const activeWordInSentence = currentWord
    ? currentIndex - (sentenceStartMap.current[currentSentenceIdx] ?? 0)
    : -1;

  const rows: React.ReactNode[] = [];
  for (let sIdx = winStart; sIdx < winEnd; sIdx++) {
    const sentence = doc.sentences[sIdx];
    const startIdx = sentenceStartMap.current[sIdx] ?? 0;
    const isCurrent = sIdx === currentSentenceIdx;
    const startsNewPara = doc.words[startIdx]?.startsNewParagraph ?? false;
    // Only the active sentence needs to know which word is current; others get -1
    // so their memoized rows never re-render on word-ticks within other sentences.
    const currentWordInSentence = isCurrent ? activeWordInSentence : -1;
    // A sentence fully before the active word is "past" (dim all its words).
    const isPastSentence = !isCurrent && startIdx + sentence.length <= currentIndex;

    rows.push(
      <SentenceRow
        key={sIdx}
        sIdx={sIdx}
        sentence={sentence}
        startIdx={startIdx}
        isCurrent={isCurrent}
        currentWordInSentence={currentWordInSentence}
        isPastSentence={isPastSentence}
        startsNewPara={startsNewPara}
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
      className="text-panel h-full overflow-y-auto bg-surface px-6 py-6 sm:px-24 sm:py-10"
    >
      <div className="max-w-3xl mx-auto pb-[50vh] pt-[40vh]">{rows}</div>
    </div>
  );
}