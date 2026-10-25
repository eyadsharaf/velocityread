export interface TimedWord {
  word: string;
  orpIndex: number;
  /** Total per-word time including punctuation/paragraph pauses. */
  displayTime: number;
  /** Per-word time from content multipliers only, pauses excluded. */
  wordTime: number;
  sentenceIndex: number;
  wordIndexInSentence: number;
  startsNewParagraph: boolean;
  /** Index into ParsedDocument.paragraphs — the source paragraph this word belongs to. */
  paragraphIndex: number;
  sentenceLength: number;
  isMidSentence: boolean;
}

export interface ParsedDocument {
  words: TimedWord[];
  sentences: string[][];
  /** Sentence indices grouped by source paragraph, in document order. */
  paragraphs: number[][];
  totalWords: number;
}

export interface Sentence {
  words: string[];
  startIndex: number;
}

/** One book in the library — small metadata; the file blob lives under its own key. */
export interface LibraryEntry {
  id: string;
  fileName: string;
  importWpm: number;
  addedAt: number;
  lastReadAt: number;
}
