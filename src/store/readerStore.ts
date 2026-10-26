import { create } from 'zustand';
import type { LibraryEntry, ParsedDocument } from '../types';

type ThemeName = 'dark' | 'light';

export interface ReaderSettings {
  /** Color theme. Dark is the default (constitution Principle II, Amendment v1.1.0). */
  theme: ThemeName;
  /** RSVP word size multiplier — S 0.85 · M 1 · L 1.15 · XL 1.3. */
  rsvpScale: number;
  /** Reading pane body font size in px — S 14 · M 16 · L 18. */
  readerFont: number;
  /** Collapse the text pane for distraction-free RSVP. */
  focusMode: boolean;
  /** Punctuation/paragraph pauses during RSVP playback (pacing algorithm). */
  pacingPauses: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  rsvpScale: 1,
  readerFont: 16,
  focusMode: false,
  pacingPauses: true,
};

const RSVP_SCALES = [0.85, 1, 1.15, 1.3];
const READER_FONTS = [14, 16, 18];

/** Coerce unknown persisted data into a valid settings object (bad → defaults). */
export function normalizeSettings(raw: unknown): ReaderSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  if (r.theme === 'dark' || r.theme === 'light') out.theme = r.theme;
  if (typeof r.rsvpScale === 'number' && RSVP_SCALES.includes(r.rsvpScale)) {
    out.rsvpScale = r.rsvpScale;
  }
  if (typeof r.readerFont === 'number' && READER_FONTS.includes(r.readerFont)) {
    out.readerFont = r.readerFont;
  }
  if (typeof r.focusMode === 'boolean') out.focusMode = r.focusMode;
  if (typeof r.pacingPauses === 'boolean') out.pacingPauses = r.pacingPauses;
  return out;
}

interface ReaderState {
  doc: ParsedDocument | null;
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
  fileName: string | null;
  /** Library id of the open book (null when reading nothing / on library screen). */
  currentBookId: string | null;
  /** In-memory copy of the stored library (source of truth: IndexedDB). */
  library: LibraryEntry[];
  userScrolledAway: boolean;
  /** Set when launch restore failed but the book was kept (retryable). */
  restoreError: string | null;
  /** True once launch-time restore has run — prevents import-screen flash. */
  hydrated: boolean;
  /** Incremented by keyboard shortcuts so the controls fade timer resets. */
  controlsWake: number;
  settings: ReaderSettings;

  wakeControls: () => void;
  setDocument: (doc: ParsedDocument, fileName: string, bookId: string) => void;
  setLibrary: (library: LibraryEntry[]) => void;
  /** Leave the open book back to the library — the book stays stored + resumable. */
  exitToLibrary: () => void;
  /**
   * Open a parsed book (library tap or launch restore): clamp the saved index
   * into range, restore per-book WPM, paused, no dialogs.
   */
  openBook: (
    doc: ParsedDocument,
    fileName: string,
    bookId: string,
    restore: { index: number; wpm: number }
  ) => void;
  setCurrentIndex: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setWpm: (wpm: number) => void;
  setUserScrolledAway: (away: boolean) => void;
  setRestoreError: (msg: string | null) => void;
  setHydrated: () => void;
  updateSettings: (patch: Partial<ReaderSettings>) => void;
  rewindSentence: () => void;
  skipSentence: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  doc: null,
  currentIndex: 0,
  isPlaying: false,
  wpm: 350,
  fileName: null,
  currentBookId: null,
  library: [],
  userScrolledAway: false,
  restoreError: null,
  hydrated: false,
  controlsWake: 0,
  settings: DEFAULT_SETTINGS,

  wakeControls: () => set((s) => ({ controlsWake: s.controlsWake + 1 })),

  setDocument: (doc, fileName, bookId) =>
    set({
      doc,
      fileName,
      currentBookId: bookId,
      currentIndex: 0,
      isPlaying: false,
      userScrolledAway: false,
    }),

  setLibrary: (library) => set({ library }),

  exitToLibrary: () =>
    set({
      doc: null,
      currentIndex: 0,
      isPlaying: false,
      fileName: null,
      currentBookId: null,
      userScrolledAway: false,
    }),

  openBook: (doc, fileName, bookId, restore) =>
    set({
      doc,
      fileName,
      currentBookId: bookId,
      currentIndex: Math.min(
        restore.index,
        Math.max(0, doc.words.length - 1)
      ),
      wpm: restore.wpm,
      isPlaying: false,
      userScrolledAway: false,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setWpm: (wpm) => {
    const clamped = Math.max(50, Math.min(2000, wpm));
    set({ wpm: clamped });
  },

  setUserScrolledAway: (away) => set({ userScrolledAway: away }),

  setRestoreError: (msg) => set({ restoreError: msg }),

  updateSettings: (patch) =>
    set((s) => {
      // Toggling focus mode unmounts/remounts the text pane — clear any
      // stale scroll-away flag so the resume overlay can't get stuck.
      const focusChanged =
        patch.focusMode !== undefined && patch.focusMode !== s.settings.focusMode;
      return {
        settings: { ...s.settings, ...patch },
        ...(focusChanged ? { userScrolledAway: false } : {}),
      };
    }),

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

  setHydrated: () => set({ hydrated: true }),
}));
