/**
 * Calculate the ORP (Optimal Recognition Point) index for a word.
 * 0-based index into the word's Unicode code points.
 */
export function getOrpIndex(word: string): number {
  const len = [...word].length;
  if (len <= 1) return 0;
  if (len === 2) return 1;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}
