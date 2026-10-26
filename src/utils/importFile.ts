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

/** File types accepted by every import surface (drop zone + library picker). */
export const ACCEPTED_FILES = '.epub,.pdf,.txt,.md';

/**
 * Canonical base WPM for all timing math. Every document is parsed at this
 * rate so playback scaling (`350 / currentWpm`) is exact regardless of the
 * book's importWpm or the user's current speed.
 */
export const TIMING_BASE_WPM = 350;

/**
 * Parse any supported file (EPUB / PDF / TXT / MD) into a ParsedDocument.
 * The PDF and EPUB parsers pull in pdfjs-dist + epubjs (~most of the bundle)
 * and are dynamically imported so a plain-text first load stays small.
 */
async function parseAny(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'epub') {
    const { parseEpub } = await import('./epubParser');
    return parseEpub(file, TIMING_BASE_WPM);
  }
  if (ext === 'pdf') {
    const { parsePdf } = await import('./pdfParser');
    return parsePdf(file, TIMING_BASE_WPM);
  }
  if (ext === 'md' || ext === 'markdown') {
    return parseMarkdown(await file.text(), TIMING_BASE_WPM);
  }
  return parseText(await file.text(), TIMING_BASE_WPM);
}

/**
 * Import a file into the library and make it the current book: parse →
 * validate → store blob/metadata/progress → set the restore pointer.
 * `wpm` is recorded as the book's default reading speed (importWpm) but
 * timing is always computed at TIMING_BASE_WPM.
 * Returns everything the caller needs to open it in the store.
 */
export async function importAndOpen(
  file: File,
  wpm: number
): Promise<{ doc: ParsedDocument; entry: LibraryEntry; library: LibraryEntry[] }> {
  const doc = await parseAny(file);
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

/** Thrown when a book id has no library entry — data is genuinely gone. */
export class BookNotFoundError extends Error {
  constructor() {
    super('Book not found in library');
    this.name = 'BookNotFoundError';
  }
}

/** Thrown when the stored file blob is gone — unrecoverable, safe to prune. */
export class BookDataMissingError extends Error {
  constructor() {
    super('Book file missing from storage');
    this.name = 'BookDataMissingError';
  }
}

/**
 * Load a library book for reading: blob → parse → progress. Used by both the
 * library screen (card tap) and launch restore. Only `BookNotFoundError` /
 * `BookDataMissingError` mean the data is gone — anything else (parser
 * regression, chunk-load failure, transient error) may be recoverable and
 * must NOT cause the caller to delete the book.
 */
export async function loadBookForReading(id: string): Promise<{
  doc: ParsedDocument;
  entry: LibraryEntry;
  progress: StoredProgress | null;
}> {
  const library = await loadLibrary();
  const entry = library.find((e) => e.id === id);
  if (!entry) throw new BookNotFoundError();

  const stored = await loadBookBlob(id);
  if (!stored) throw new BookDataMissingError();

  const file = new File([stored.blob], stored.fileName);
  const doc = await parseAny(file);
  if (doc.words.length === 0) {
    throw new Error('No readable text found in file');
  }

  const progress = await loadProgress(id);

  // Refresh lastReadAt so the library sorts by recent reading.
  entry.lastReadAt = Date.now();
  await saveLibrary(library);

  return { doc, entry, progress };
}
