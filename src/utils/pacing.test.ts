import { describe, it, expect } from 'vitest';
import { calculateWordTime } from './pacing';
import type { PacingContext } from './pacing';

const base = 60000 / 350;

const ctx = (over: Partial<PacingContext> = {}): PacingContext => ({
  sentenceLength: 1,
  isMidSentence: false,
  endsParagraph: false,
  ...over,
});

// All test words are outside FUNCTION_WORDS (the, a, is, of, to, in, it, and, that).

describe('calculateWordTime — content multipliers (wordTime)', () => {
  it('plain short word → base', () => {
    expect(calculateWordTime('cat', ctx(), 350).wordTime).toBeCloseTo(base, 1);
  });

  it('8+ letter word → 1.3×', () => {
    expect(calculateWordTime('sunshine', ctx(), 350).wordTime).toBeCloseTo(
      base * 1.3,
      1
    );
  });

  it('14+ letter word → 1.6×', () => {
    expect(calculateWordTime('extraordinarily', ctx(), 350).wordTime).toBeCloseTo(
      base * 1.6,
      1
    );
  });

  it('digits at word start → 1.4×', () => {
    expect(calculateWordTime('42', ctx(), 350).wordTime).toBeCloseTo(
      base * 1.4,
      1
    );
  });

  it('function words → 0.7×', () => {
    expect(calculateWordTime('the', ctx(), 350).wordTime).toBeCloseTo(
      base * 0.7,
      1
    );
  });

  it('mid-sentence capitalized word → 1.2×', () => {
    expect(
      calculateWordTime('Zebra', ctx({ isMidSentence: true }), 350).wordTime
    ).toBeCloseTo(base * 1.2, 1);
  });

  it('multipliers stack multiplicatively (8-letter mid-sentence capital → 1.3 × 1.2)', () => {
    expect(
      calculateWordTime('Sunshine', ctx({ isMidSentence: true }), 350).wordTime
    ).toBeCloseTo(base * 1.3 * 1.2, 1);
  });
});

describe('calculateWordTime — pauses (displayTime − wordTime)', () => {
  const pause = (word: string, over: Partial<PacingContext> = {}, wpm = 350) => {
    const t = calculateWordTime(word, ctx(over), wpm);
    return t.displayTime - t.wordTime;
  };

  it('period after a short sentence (≤7 words) → 1.0×', () => {
    expect(pause('done.', { sentenceLength: 5 })).toBeCloseTo(1.0 * base, 1);
  });

  it('period after a medium sentence (8–22 words) → 2.2×', () => {
    expect(pause('done.', { sentenceLength: 12 })).toBeCloseTo(2.2 * base, 1);
  });

  it('period after a long sentence (>22 words) → 3.3×', () => {
    expect(pause('done.', { sentenceLength: 30 })).toBeCloseTo(3.3 * base, 1);
  });

  it('question and exclamation marks → 1.3×', () => {
    expect(pause('why?', { sentenceLength: 5 })).toBeCloseTo(1.3 * base, 1);
    expect(pause('wow!', { sentenceLength: 5 })).toBeCloseTo(1.3 * base, 1);
  });

  it('comma → 0.5×, semicolon/colon → 0.75×, dash/ellipsis → 0.75×', () => {
    expect(pause('yes,')).toBeCloseTo(0.5 * base, 1);
    expect(pause('yes;')).toBeCloseTo(0.75 * base, 1);
    expect(pause('yes:')).toBeCloseTo(0.75 * base, 1);
    expect(pause('yes—')).toBeCloseTo(0.75 * base, 1);
    expect(pause('yes…')).toBeCloseTo(0.75 * base, 1);
  });

  it('endsParagraph upgrades any pause to at least 2.5× (single combined gap)', () => {
    expect(pause('done.', { sentenceLength: 12, endsParagraph: true })).toBeCloseTo(
      2.5 * base,
      1
    );
    expect(pause('yes,', { endsParagraph: true })).toBeCloseTo(2.5 * base, 1);
    // unpunctuated paragraph end (e.g. a heading) still pauses
    expect(pause('heading', { endsParagraph: true })).toBeCloseTo(2.5 * base, 1);
  });

  it('displayTime = wordTime + pause (pause is not multiplied by content multipliers)', () => {
    const t = calculateWordTime('sunshine.', ctx({ sentenceLength: 12 }), 350);
    expect(t.displayTime).toBeCloseTo(base * 1.3 + base * 2.2, 1);
  });

  it('clamps both times to an 80ms floor at extreme WPM', () => {
    const t = calculateWordTime('the', ctx(), 2000); // base 30ms → 0.7× = 21ms
    expect(t.wordTime).toBe(80);
    expect(t.displayTime).toBe(80);
  });

  it('scales with the caller WPM base', () => {
    const t = calculateWordTime('cat', ctx(), 700); // base = 60000/700
    expect(t.wordTime).toBeCloseTo(60000 / 700, 1);
  });
});
