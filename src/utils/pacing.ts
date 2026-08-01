import FUNCTION_WORDS from './functionWords';

export interface PacingContext {
  sentenceLength: number;
  isMidSentence: boolean;
  startsNewParagraph: boolean;
}

export function calculateWordTime(
  word: string,
  context: PacingContext,
  baseWPM: number
): number {
  const base = 60000 / baseWPM;
  let displayMult = 1.0;
  let pauseMult = 0;

  const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
  const alphaLen = [...cleanWord].length;

  if (alphaLen > 13) displayMult *= 1.6;
  else if (alphaLen >= 8) displayMult *= 1.3;

  if (FUNCTION_WORDS.has(cleanWord.toLowerCase())) displayMult *= 0.7;

  if (/^\d/.test(word)) displayMult *= 1.4;

  if (context.isMidSentence && /^[A-Z]/.test(cleanWord) && alphaLen > 1)
    displayMult *= 1.2;

  if (word.endsWith('.')) {
    pauseMult =
      context.sentenceLength <= 7 ? 1.0 : context.sentenceLength <= 22 ? 2.2 : 3.3;
  } else if (word.endsWith('?') || word.endsWith('!')) {
    pauseMult = 1.3;
  } else if (word.endsWith(',')) {
    pauseMult = 0.5;
  } else if (word.endsWith(';') || word.endsWith(':')) {
    pauseMult = 0.75;
  } else if (word.endsWith('—') || word.endsWith('…')) {
    pauseMult = 0.75;
  }

  if (context.startsNewParagraph) pauseMult = Math.max(pauseMult, 2.5);

  return Math.max(base * displayMult + base * pauseMult, 80);
}
