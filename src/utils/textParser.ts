import type { TimedWord, ParsedDocument } from '../types';
import { getOrpIndex } from './orp';
import { calculateWordTime } from './pacing';

export function parseText(rawText: string, baseWPM: number = 350): ParsedDocument {
  // Normalize line breaks - treat double newline as paragraph break
  const normalizedText = rawText.replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\s*\n/);

  const words: TimedWord[] = [];
  const sentences: string[][] = [];
  const paragraphGroups: number[][] = [];
  let globalWordIndex = 0;
  let seenParagraph = false;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx].trim();
    if (!para) continue;

    // Split into sentences at whitespace that follows sentence-ending
    // punctuation. Implemented with a sentinel replace instead of regex
    // lookbehind — lookbehind is a parse-time syntax error on Safari ≤16.3,
    // which would white-screen the whole bundle. Requiring whitespace keeps
    // intra-word punctuation intact ("3.5", "U.S.A.", "?!").
    const rawSentences = para.replace(/([.!?])\s+/g, '$1\u0000').split('\u0000');

    // Index of the last non-empty sentence — its final word takes the
    // paragraph pause (instead of stacking it onto the next paragraph's
    // first word, which produced a double gap at every boundary).
    let lastSentenceIdx = -1;
    for (let i = 0; i < rawSentences.length; i++) {
      if (rawSentences[i].trim()) lastSentenceIdx = i;
    }

    const sentenceIndices: number[] = [];
    for (let sIdx = 0; sIdx < rawSentences.length; sIdx++) {
      const rawSentence = rawSentences[sIdx].trim();
      if (!rawSentence) continue;

      const sentenceWords = rawSentence.split(/\s+/).filter(Boolean);
      const isFirstSentenceOfPara = sentenceIndices.length === 0;
      sentences.push(sentenceWords);
      sentenceIndices.push(sentences.length - 1);

      for (let wIdx = 0; wIdx < sentenceWords.length; wIdx++) {
        const word = sentenceWords[wIdx];
        const orpIndex = getOrpIndex(word);
        const isMidSentence = wIdx > 0 && wIdx < sentenceWords.length - 1;
        // Only the paragraph's very first word (first sentence, first word) —
        // sentence-initial words like "Mr." must NOT count as paragraph starts.
        const startsNewParagraph =
          seenParagraph && isFirstSentenceOfPara && wIdx === 0;
        const endsParagraph = sIdx === lastSentenceIdx && wIdx === sentenceWords.length - 1;

        const { wordTime, displayTime } = calculateWordTime(word, {
          sentenceLength: sentenceWords.length,
          isMidSentence,
          endsParagraph,
        }, baseWPM);

        words.push({
          word,
          orpIndex,
          displayTime,
          wordTime,
          sentenceIndex: sentences.length - 1,
          wordIndexInSentence: wIdx,
          startsNewParagraph,
          paragraphIndex: paragraphGroups.length,
          sentenceLength: sentenceWords.length,
          isMidSentence,
        });
        globalWordIndex++;
      }
    }

    if (sentenceIndices.length > 0) {
      paragraphGroups.push(sentenceIndices);
      seenParagraph = true;
    }
  }

  return {
    words,
    sentences,
    paragraphs: paragraphGroups,
    totalWords: words.length,
  };
}
