import type { TimedWord, ParsedDocument } from '../types';
import { getOrpIndex } from './orp';
import { calculateWordTime } from './pacing';

export function parseText(rawText: string, baseWPM: number = 350): ParsedDocument {
  // Normalize line breaks - treat double newline as paragraph break
  const normalizedText = rawText.replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\s*\n/);

  const words: TimedWord[] = [];
  const sentences: string[][] = [];
  let globalWordIndex = 0;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx].trim();
    if (!para) continue;

    // Split into sentences using lookahead for capital letters after sentence-ending punctuation
    // or just split on sentence boundaries heuristically
    const rawSentences = para.match(/[^.!?]+[.!?]*/g) || [para];

    for (let sIdx = 0; sIdx < rawSentences.length; sIdx++) {
      const rawSentence = rawSentences[sIdx].trim();
      if (!rawSentence) continue;

      const sentenceWords = rawSentence.split(/\s+/).filter(Boolean);
      sentences.push(sentenceWords);
      const sentenceStartGlobal = globalWordIndex;

      for (let wIdx = 0; wIdx < sentenceWords.length; wIdx++) {
        const word = sentenceWords[wIdx];
        const orpIndex = getOrpIndex(word);
        const isMidSentence = wIdx > 0 && wIdx < sentenceWords.length - 1;
        const startsNewParagraph = pIdx > 0 && wIdx === 0;

        const displayTime = calculateWordTime(word, {
          sentenceLength: sentenceWords.length,
          isMidSentence,
          startsNewParagraph,
        }, baseWPM);

        words.push({
          word,
          orpIndex,
          displayTime,
          sentenceIndex: sentences.length - 1,
          wordIndexInSentence: wIdx,
          startsNewParagraph,
          sentenceLength: sentenceWords.length,
          isMidSentence,
        });
        globalWordIndex++;
      }
    }
  }

  return {
    words,
    sentences,
    totalWords: words.length,
  };
}
