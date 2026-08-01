export interface TimedWord {
  word: string;
  orpIndex: number;
  displayTime: number;
  sentenceIndex: number;
  wordIndexInSentence: number;
  startsNewParagraph: boolean;
  sentenceLength: number;
  isMidSentence: boolean;
}

export interface ParsedDocument {
  words: TimedWord[];
  sentences: string[][];
  totalWords: number;
}

export interface Sentence {
  words: string[];
  startIndex: number;
}
