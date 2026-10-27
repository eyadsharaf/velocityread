/**
 * The built-in sample essay — a short, original piece whose punctuation
 * deliberately exercises the pacing engine (comma chains, full stops,
 * paragraph breaks, long words). Built into an in-memory File so it
 * flows through the standard import pipeline: parsed, stored, and
 * resumable like any imported book. Stats cited here match the claims
 * registry in the campaign positioning (238 wpm average, 350 default).
 */
export const SAMPLE_FILE_NAME = 'On Reading Faster.md';

export const SAMPLE_TEXT = `You are watching these words one at a time. That is the whole trick. Instead of dragging your eyes across a line, losing your place, and drifting back to reread, the text comes to you at a fixed pace — and your brain, which is faster than your eyes, keeps up easily.

The average adult reads about 238 words per minute. VelocityRead starts you at 350, roughly 47% faster. That is not a magic number; it is the speed at which attentive readers still understand what they read, and you can turn it up or down at any time.

Notice the rhythm as you go. This sentence has commas, and each comma gives you half a beat. A full stop buys you a whole one. Paragraph breaks breathe longer still, because your mind needs a moment to file away what it just learned. Punctuation is not decoration; it is timing. Turn pacing pauses off in settings and the difference is immediately, uncomfortably obvious.

Comprehension is the point, not the casualty. The full text stays below, highlighted word by word, so if you ever feel the meaning slipping you can simply look down — or tap any word to jump straight to it. Speed you cannot steer is just skimming with extra steps.

If your hands are on a keyboard: space plays and pauses, the arrow keys skip sentences and change speed. If they are not, everything works by touch.

This sample is yours to delete. The next book should be yours.
`;

/** Build the sample as a File for the standard import path. */
export function sampleFile(): File {
  return new File([SAMPLE_TEXT], SAMPLE_FILE_NAME, { type: 'text/markdown' });
}
