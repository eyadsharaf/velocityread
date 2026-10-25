import { parseText } from './textParser';
import { parseMarkdown } from './markdownParser';
import {
  loadBookBlob,
  loadLibrary,
  loadProgress,
  newId,
  saveBookBlob,
  saveLibrary,
  setCurrentBookId,
  saveProgressNow,
  type StoredProgress,
} from './persistence';
import type { LibraryEntry, ParsedDocument } from '../types';

/**
 * Parse any supported file (EPUB / PDF / TXT / MD) into a ParsedDocument.
 * The PDF and EPUB parsers pull in pdfjs-dist + epubjs (~most of the bundle)
 * and are dynamically imported so a plain-text first load stays small.
 */
export async function parseAny(file: File, wpm: number): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'epub') {
    const { parseEpub } = await import('./epubParser');
    return parseEpub(file, wpm);
  }
  if (ext === 'pdf') {
    const { parsePdf } = await import('./pdfParser');
    return parsePdf(file, wpm);
  }
  if (ext === 'md' || ext === 'markdown') {
    return parseMarkdown(await file.text(), wpm);
  }
  return parseText(await file.text(), wpm);
}

/**
 * Import a file into the library and make it the current book: parse →
 * validate → store blob/metadata/progress → set the restore pointer.
 * Returns everything the caller needs to open it in the store.
 */
export async function importAndOpen(
  file: File,
  wpm: number
): Promise<{ doc: ParsedDocument; entry: LibraryEntry; library: LibraryEntry[] }> {
  const doc = await parseAny(file, wpm);
  if (doc.words.length === 0) {
    throw new Error('No readable text found in file');
  }

  const now = Date.now();
  const entry: LibraryEntry = {
    id: newId(),
    fileName: file.name,
    importWpm: wpm,
    addedAt: now,
    lastReadAt: now,
  };

  await saveBookBlob(entry.id, { blob: file, fileName: file.name, importWpm: wpm });

  const library = await loadLibrary();
  library.push(entry);
  await saveLibrary(library);

  await saveProgressNow(entry.id, {
    currentIndex: 0,
    totalWords: doc.totalWords,
    wpm,
  });
  await setCurrentBookId(entry.id);

  return { doc, entry, library };
}

/**
 * Load a library book for reading: blob → parse → progress. Used by both the
 * library screen (card tap) and launch restore. Throws when the entry or its
 * blob is missing, or the file can no longer be parsed.
 */
export async function loadBookForReading(id: string): Promise<{
  doc: ParsedDocument;
  entry: LibraryEntry;
  progress: StoredProgress | null;
}> {
  const library = await loadLibrary();
  const entry = library.find((e) => e.id === id);
  if (!entry) throw new Error('Book not found in library');

  const stored = await loadBookBlob(id);
  if (!stored) throw new Error('Book file missing from storage');

  const file = new File([stored.blob], stored.fileName);
  const doc = await parseAny(file, stored.importWpm);
  if (doc.words.length === 0) {
    throw new Error('No readable text found in file');
  }

  const progress = await loadProgress(id);

  // Refresh lastReadAt so the library sorts by recent reading.
  entry.lastReadAt = Date.now();
  await saveLibrary(library);

  return { doc, entry, progress };
}
