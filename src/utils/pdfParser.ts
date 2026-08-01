import type { ParsedDocument } from '../types';
import { parseText } from './textParser';
// @ts-ignore - pdfjs-dist types
import * as pdfjsLib from 'pdfjs-dist';

export async function parsePdf(file: File, baseWPM: number = 350): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += text + '\n\n';
  }

  if (!fullText.trim()) {
    throw new Error('Could not extract text from PDF');
  }

  return parseText(fullText, baseWPM);
}
