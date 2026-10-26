// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseEpub } from './epubParser';

/**
 * epubjs API contract test. parseEpub depends on the external epubjs surface
 * (ePub(), book.ready, book.spine.each, item.load) — this locks the parts we
 * use so a major epubjs bump that breaks parsing fails here, not in users'
 * libraries. jsdom provides the browser APIs (DOMParser, Blob, File) the
 * browser build path expects.
 *
 * Note: jsdom may not implement innerText, in which case the parser's
 * textContent fallback merges <p> blocks — paragraph-count assertions are
 * kept loose for that reason; token extraction is the contract.
 */

// jsdom rewrites import.meta.url to http:// — resolve from the repo root
// (vitest's cwd) instead.
const fixture = readFileSync('src/utils/__fixtures__/smoke.epub');

describe('parseEpub — epubjs API contract', () => {
  it(
    'extracts words from a minimal EPUB',
    async () => {
      const file = new File([fixture], 'smoke.epub');
      const doc = await parseEpub(file, 350);

      expect(doc.totalWords).toBeGreaterThan(0);
      expect(doc.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(doc.words.length).toBe(doc.totalWords);

      const flat = doc.words.map((w) => w.word).join(' ');
      expect(flat).toContain('first');
      expect(flat).toContain('Second');
      expect(flat).toContain('Mr.');
      // decimal number survives as one token
      expect(flat).toContain('3.5');
      // Every word carries timing + placement metadata
      expect(doc.words[0].displayTime).toBeGreaterThan(0);
      expect(doc.words[0].wordTime).toBeGreaterThan(0);
      expect(Number.isInteger(doc.words[0].paragraphIndex)).toBe(true);
    },
    20000
  );
});
