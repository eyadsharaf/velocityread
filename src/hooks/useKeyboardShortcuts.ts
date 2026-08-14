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
    wakeControls,
  } = useReaderStore();

  useEffect(() => {
    if (!doc) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          wakeControls();
          if (userScrolledAway) return;
          setPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          wakeControls();
          rewindSentence();
          break;
        case 'ArrowRight':
          e.preventDefault();
          wakeControls();
          skipSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          wakeControls();
          setWpm(wpm + 25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          wakeControls();
          setWpm(wpm - 25);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, isPlaying, setPlaying, rewindSentence, skipSentence, wpm, setWpm, userScrolledAway, wakeControls]);
}
