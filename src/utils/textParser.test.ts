import { describe, it, expect } from 'vitest';
import { parseText } from './textParser';

const SAMPLE = [
  '', // leading blank line — must NOT mark the first real paragraph
  'First paragraph has two sentences. This is the second one!',
  '',
  'Second paragraph, with a comma, ends here. Mr. Smith has 3.5 dollars. One more.',
  '',
  'Third paragraph is short.',
].join('\n');

describe('parseText — paragraph structure', () => {
  const doc = parseText(SAMPLE, 350);

  it('groups sentences by source paragraph', () => {
    expect(doc.paragraphs).toHaveLength(3);
    expect(doc.paragraphs[0]).toHaveLength(2); // two sentences
    expect(doc.paragraphs[2]).toHaveLength(1); // one sentence
  });

  it('flattening a paragraph group reproduces the source text exactly', () => {
    const flat = (p: number) =>
      doc.paragraphs[p].flatMap((s) => doc.sentences[s]).join(' ');
    expect(flat(0)).toBe('First paragraph has two sentences. This is the second one!');
    expect(flat(1)).toBe(
      'Second paragraph, with a comma, ends here. Mr. Smith has 3.5 dollars. One more.'
    );
  });

  it('assigns a dense, sequential paragraphIndex to every word', () => {
    expect(doc.words.map((w) => w.paragraphIndex).join('')).toMatch(
      /^0+1+2+$/
    );
  });

  it('does not flag the first paragraph as "new" despite leading blank lines', () => {
    expect(doc.words[0].startsNewParagraph).toBe(false);
  });

  it('flags only the first word of later paragraphs as "new"', () => {
    const starts = doc.words.filter((w) => w.startsNewParagraph);
    expect(starts.map((w) => w.word)).toEqual(['Second', 'Third']);
  });

  it('keeps per-paragraph word counts consistent with totalWords', () => {
    const counts = doc.paragraphs.map((g) =>
      g.reduce((n, s) => n + doc.sentences[s].length, 0)
    );
    expect(counts.reduce((a, b) => a + b, 0)).toBe(doc.totalWords);
    expect(doc.totalWords).toBe(doc.words.length);
  });
});

describe('parseText — sentence splitting fidelity', () => {
  it('keeps decimal numbers as one word ("3.5", not "3. 5")', () => {
    const doc = parseText('The value 3.5 matters here.', 350);
    expect(doc.words.map((w) => w.word)).toContain('3.5');
  });

  it('keeps dotted abbreviations as one word ("U.S.A.")', () => {
    const doc = parseText('They visited the U.S.A. last summer.', 350);
    expect(doc.words.map((w) => w.word)).toContain('U.S.A.');
  });

  it('keeps stacked punctuation together ("?!")', () => {
    const doc = parseText('What?! Really?', 350);
    expect(doc.sentences[0]).toEqual(['What?!']);
  });

  it('splits after abbreviations like "Mr." but preserves the rendered text', () => {
    const doc = parseText('Mr. Smith arrived.', 350);
    const flat = doc.sentences.flat().join(' ');
    expect(flat).toBe('Mr. Smith arrived.');
  });

  it('normalizes CRLF line endings', () => {
    const doc = parseText('One paragraph.\r\n\r\nSecond paragraph.', 350);
    expect(doc.paragraphs).toHaveLength(2);
  });
});

describe('parseText — timing split (wordTime vs displayTime)', () => {
  const doc = parseText(SAMPLE, 350);
  const base = 60000 / 350;
  const pauseOf = (word: string) => {
    const w = doc.words.find((x) => x.word === word);
    if (!w) throw new Error(`word "${word}" not in sample`);
    return w.displayTime - w.wordTime;
  };

  it('mid-sentence words carry no pause (wordTime === displayTime)', () => {
    expect(pauseOf('has')).toBe(0);
    expect(pauseOf('Smith')).toBe(0);
  });

  it('short mid-paragraph sentence ends (≤7 words) pause 1.0×', () => {
    // "First paragraph has two sentences." = 5 words, mid-paragraph
    expect(pauseOf('sentences.')).toBeCloseTo(1.0 * base, 1);
  });

  it('paragraph-end words take a single combined 2.5× pause', () => {
    expect(pauseOf('one!')).toBeCloseTo(2.5 * base, 1); // ends paragraph 0
    expect(pauseOf('more.')).toBeCloseTo(2.5 * base, 1); // ends paragraph 1
  });

  it('the first word of a new paragraph carries NO pause (single-gap fix)', () => {
    expect(pauseOf('Second')).toBe(0);
    expect(pauseOf('Third')).toBe(0);
  });

  it('commas pause 0.5× on the comma word only', () => {
    expect(pauseOf('comma,')).toBeCloseTo(0.5 * base, 1);
    expect(pauseOf('a')).toBe(0); // word before the comma word
  });

  it('long mid-paragraph sentences (8–22 words) pause 2.2×', () => {
    const long = parseText(
      'This sentence was deliberately made long enough to cross the eight-word threshold. Short.',
      350
    );
    const w = long.words.find((x) => x.word === 'threshold.')!;
    expect(w.displayTime - w.wordTime).toBeCloseTo(2.2 * base, 1);
  });
});
