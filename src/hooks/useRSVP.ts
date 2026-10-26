import { useEffect, useRef, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import { TIMING_BASE_WPM } from '../utils/importFile';

export function useRSVP() {
  const { doc, currentIndex, isPlaying, wpm, setCurrentIndex, setPlaying } = useReaderStore();
  const pacingPauses = useReaderStore((s) => s.settings.pacingPauses);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const indexRef = useRef<number>(currentIndex);
  const wpmRef = useRef<number>(wpm);
  const pacingRef = useRef<boolean>(pacingPauses);

  // Keep refs in sync
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    wpmRef.current = wpm;
  }, [wpm]);

  useEffect(() => {
    pacingRef.current = pacingPauses;
  }, [pacingPauses]);

  const tick = useCallback(
    (now: number) => {
      if (!doc) return;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      elapsedRef.current += dt;

      const word = doc.words[indexRef.current];
      if (!word) return;

      // Recalculate timing based on current WPM in case it changed.
      // Timing is always computed at TIMING_BASE_WPM (see importFile), so
      // this ratio is exact. pacingPauses off → content multipliers only.
      const scale = TIMING_BASE_WPM / wpmRef.current;
      const targetTime = (pacingRef.current ? word.displayTime : word.wordTime) * scale;

      if (elapsedRef.current >= targetTime) {
        elapsedRef.current = 0;
        const next = indexRef.current + 1;
        if (next >= doc.words.length) {
          setPlaying(false);
          return;
        }
        indexRef.current = next;
        setCurrentIndex(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [doc, setCurrentIndex, setPlaying]
  );

  useEffect(() => {
    if (isPlaying && doc) {
      lastTimeRef.current = performance.now();
      elapsedRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, doc, tick]);

  return { currentIndex, isPlaying };
}
