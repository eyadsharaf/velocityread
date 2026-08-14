import type { ParsedDocument } from '../types';
import { parseText } from './textParser';
// @ts-ignore - epubjs has no types
import ePub from 'epubjs';

export async function parseEpub(file: File, baseWPM: number = 350): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;

  let fullText = '';
  const items: any[] = [];
  book.spine.each((item: any) => {
    items.push(item);
  });

  for (const item of items) {
    try {
      const doc = await item.load(book.load.bind(book));
      const body = doc.body || doc.documentElement || doc;
      let text: string = '';
      if (typeof body.innerText === 'string') {
        text = body.innerText;
      } else if (typeof body.textContent === 'string') {
        text = body.textContent;
      } else {
        // Fallback: serialize and strip tags
        text = (body.innerHTML || '').replace(/<[^>]+>/g, ' ');
      }
      // Normalize whitespace inside the section
      text = text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
      if (text) fullText += text + '\n\n';
    } catch (e) {
      // skip unreadable sections
    }
  }

  if (!fullText.trim()) {
    throw new Error('Could not extract text from EPUB');
  }

  return parseText(fullText, baseWPM);
}
