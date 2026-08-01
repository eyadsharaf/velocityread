import { create } from 'zustand';
import type { ParsedDocument } from '../types';

interface ReaderState {
  doc: ParsedDocument | null;
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
  fileName: string | null;
  userScrolledAway: boolean;

  setDocument: (doc: ParsedDocument, fileName: string) => void;
  setCurrentIndex: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setWpm: (wpm: number) => void;
  setUserScrolledAway: (away: boolean) => void;
  rewindSentence: () => void;
  skipSentence: () => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  doc: null,
  currentIndex: 0,
  isPlaying: false,
  wpm: 350,
  fileName: null,
  userScrolledAway: false,

  setDocument: (doc, fileName) =>
    set({ doc, fileName, currentIndex: 0, isPlaying: false }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setWpm: (wpm) => {
    const clamped = Math.max(50, Math.min(2000, wpm));
    set({ wpm: clamped });
  },

  setUserScrolledAway: (away) => set({ userScrolledAway: away }),

  rewindSentence: () => {
    const { doc, currentIndex } = get();
    if (!doc) return;
    const currentWord = doc.words[currentIndex];
    if (!currentWord) return;
    const targetSentence = currentWord.sentenceIndex;
    // Go to start of previous sentence
    const newSentence = Math.max(0, targetSentence - 1);
    const wordIdx = doc.words.findIndex(
      (w) => w.sentenceIndex === newSentence
    );
    if (wordIdx >= 0) set({ currentIndex: wordIdx });
  },

  skipSentence: () => {
    const { doc, currentIndex } = get();
    if (!doc) return;
    const currentWord = doc.words[currentIndex];
    if (!currentWord) return;
    const targetSentence = currentWord.sentenceIndex;
    // Find first word of next sentence
    const nextSentence = targetSentence + 1;
    const wordIdx = doc.words.findIndex(
      (w) => w.sentenceIndex === nextSentence
    );
    if (wordIdx >= 0) {
      set({ currentIndex: wordIdx });
    } else {
      // Last sentence - go to end
      set({ currentIndex: doc.words.length - 1 });
    }
  },

  reset: () =>
    set({ doc: null, currentIndex: 0, isPlaying: false, fileName: null, userScrolledAway: false }),
}));
