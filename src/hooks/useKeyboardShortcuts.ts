import { useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';

export function useKeyboardShortcuts() {
  const {
    isPlaying,
    setPlaying,
    rewindSentence,
    skipSentence,
    wpm,
    setWpm,
    doc,
    userScrolledAway,
  } = useReaderStore();

  useEffect(() => {
    if (!doc) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (userScrolledAway) return;
          setPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          rewindSentence();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setWpm(wpm + 25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setWpm(wpm - 25);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, isPlaying, setPlaying, rewindSentence, skipSentence, wpm, setWpm, userScrolledAway]);
}
