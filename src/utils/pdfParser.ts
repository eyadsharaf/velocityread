import type { ParsedDocument } from '../types';
import { parseText } from './textParser';
// @ts-ignore - pdfjs-dist types
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite ?url import gives the resolved, version-matched worker URL
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker once, before any getDocument() call.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

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
    throw new Error('No readable text in PDF — it may be scanned images (OCR not supported)');
  }

  return parseText(fullText, baseWPM);
}
