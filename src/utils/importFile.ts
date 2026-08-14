import { parseText } from './textParser';
import { parseMarkdown } from './markdownParser';
import { parseEpub } from './epubParser';
import { parsePdf } from './pdfParser';
import type { ParsedDocument } from '../types';

/** Parse any supported file (EPUB / PDF / TXT / MD) into a ParsedDocument. */
export async function parseAny(file: File, wpm: number): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'epub') return parseEpub(file, wpm);
  if (ext === 'pdf') return parsePdf(file, wpm);
  if (ext === 'md' || ext === 'markdown') {
    return parseMarkdown(await file.text(), wpm);
  }
  return parseText(await file.text(), wpm);
}
