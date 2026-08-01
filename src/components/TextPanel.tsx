import { useRef, useEffect, useState, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';

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
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);
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

    const el = sentenceRefs.current[currentSentenceIdx];
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

    const el = sentenceRefs.current[currentSentenceIdx];
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

  if (!doc) return null;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onClick={handleContainerClick}
      className="h-full overflow-y-auto bg-[#1A1A1A] px-[10%] py-8"
    >
      <div className="max-w-2xl mx-auto pb-[50vh] pt-[40vh]">
        {doc.sentences.map((sentence, sIdx) => {
          const isCurrent = sIdx === currentSentenceIdx;
          const startIdx = sentenceStartMap.current[sIdx] ?? 0;
          const startsNewPara = doc.words[startIdx]?.startsNewParagraph ?? false;

          const sentenceEl = (
            <div
              key={sIdx}
              ref={(el) => { sentenceRefs.current[sIdx] = el; }}
              className={`rounded-lg px-4 py-2 transition-colors duration-200 ${
                isCurrent ? 'bg-[rgba(255,255,255,0.05)]' : ''
              }`}
              style={startsNewPara ? { marginTop: '24px' } : undefined}
            >
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '17px',
                  lineHeight: '1.5',
                  color: '#D0D0D0',
                  textAlign: 'left',
                }}
              >
                {sentence.map((word, wIdx) => {
                  const gIdx = startIdx + wIdx;
                  const isCurrentWord = gIdx === currentIndex;
                  const isPast = gIdx < currentIndex;
                  return (
                    <span key={wIdx}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWordClick(gIdx);
                        }}
                        className={`cursor-pointer transition-colors inline ${
                          isCurrentWord
                            ? 'text-[#FFFFFF] font-semibold'
                            : isPast
                            ? 'text-[#777]'
                            : ''
                        }`}
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '17px',
                        }}
                      >
                        {word}
                      </span>
                      {isCurrentWord && (
                        <span className="caret-blink inline-block w-[2px] h-[18px] bg-[#FF3B30] ml-[1px] align-middle" />
                      )}
                      {' '}
                    </span>
                  );
                })}
              </p>
            </div>
          );
          return sentenceEl;
        })}
      </div>
    </div>
  );
}
