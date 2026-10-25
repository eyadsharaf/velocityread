import { get, set, del } from 'idb-keyval';
import type { LibraryEntry } from '../types';
import type { ReaderSettings } from '../store/readerStore';

/**
 * IndexedDB persistence for the book library + reading progress + settings.
 *
 * Key layout (blobs are split from metadata so debounced progress writes
 * never rewrite large file blobs):
 *   vr:library         → LibraryEntry[]            (small, written on add/remove/open)
 *   vr:blob:<id>       → StoredBlob                (written once at import)
 *   vr:progress:<id>   → StoredProgress            (debounced while reading)
 *   vr:current         → string                    (book id to restore on launch)
 *   vr:settings        → ReaderSettings
 *
 * All operations are best-effort: the first IDB failure flips a permanent
 * `storageOk = false` flag and the app silently runs stateless from then on.
 */

const LIBRARY_KEY = 'vr:library';
const CURRENT_KEY = 'vr:current';
const SETTINGS_KEY = 'vr:settings';
const BLOB_PREFIX = 'vr:blob:';
const PROGRESS_PREFIX = 'vr:progress:';
// Legacy single-book keys (pre-library) — migrated once, then deleted.
const LEGACY_BOOK_KEY = 'vr:book';
const LEGACY_STATE_KEY = 'vr:state';

export interface StoredBlob {
  blob: Blob;
  fileName: string;
  importWpm: number;
}

export interface StoredProgress {
  currentIndex: number;
  totalWords: number;
  wpm: number;
}

/** Legacy shape (pre-library) — only used by the migration. */
interface LegacyState {
  currentIndex: number;
  wpm: number;
}

let storageOk = true;
let progressTimer: ReturnType<typeof setTimeout> | null = null;
let pendingProgress: { id: string; progress: StoredProgress } | null = null;
let lifecycleBound = false;

const storageListeners = new Set<() => void>();

function fail() {
  storageOk = false;
  storageListeners.forEach((l) => l());
}

/** True while IndexedDB is working; flips (and notifies) on first failure. */
export function isStorageOk(): boolean {
  return storageOk;
}

/**
 * Subscribe to storage-health changes. The returned fn unsubscribes.
 * Listeners are also called once at flip time — poll isStorageOk() inside.
 */
export function onStorageChange(fn: () => void): () => void {
  storageListeners.add(fn);
  return () => {
    storageListeners.delete(fn);
  };
}

/** Stable unique id (crypto.randomUUID with a non-secure-context fallback). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// --- Library index ---

export async function loadLibrary(): Promise<LibraryEntry[]> {
  if (!storageOk) return [];
  try {
    return (await get<LibraryEntry[]>(LIBRARY_KEY)) ?? [];
  } catch {
    fail();
    return [];
  }
}

export async function saveLibrary(entries: LibraryEntry[]): Promise<void> {
  if (!storageOk) return;
  try {
    await set(LIBRARY_KEY, entries);
  } catch {
    fail();
  }
}

// --- Book blobs ---

export async function saveBookBlob(id: string, book: StoredBlob): Promise<void> {
  if (!storageOk) return;
  try {
    await set(BLOB_PREFIX + id, book);
  } catch {
    fail();
  }
}

export async function loadBookBlob(id: string): Promise<StoredBlob | null> {
  if (!storageOk) return null;
  try {
    return (await get<StoredBlob>(BLOB_PREFIX + id)) ?? null;
  } catch {
    fail();
    return null;
  }
}

// --- Per-book progress ---

export async function loadProgress(id: string): Promise<StoredProgress | null> {
  if (!storageOk) return null;
  try {
    return (await get<StoredProgress>(PROGRESS_PREFIX + id)) ?? null;
  } catch {
    return null;
  }
}

async function writeProgress(id: string, progress: StoredProgress): Promise<void> {
  if (!storageOk) return;
  try {
    await set(PROGRESS_PREFIX + id, progress);
  } catch {
    fail();
  }
}

/** Immediate (non-debounced) progress write — import, exit, explicit saves. */
export function saveProgressNow(id: string, progress: StoredProgress): void {
  pendingProgress = null;
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = null;
  }
  void writeProgress(id, progress);
}

/** Debounced (500ms) progress save — called on every progress tick. */
export function saveProgressDebounced(
  id: string,
  progress: StoredProgress
): void {
  if (!storageOk) return;
  pendingProgress = { id, progress };
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    progressTimer = null;
    if (pendingProgress) {
      const { id, progress } = pendingProgress;
      void writeProgress(id, progress);
    }
  }, 500);
}

/** Immediate flush of any pending debounced progress (exit / pagehide / hidden). */
export function flushProgress(): void {
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = null;
  }
  if (pendingProgress && storageOk) {
    const { id, progress } = pendingProgress;
    void writeProgress(id, progress);
  }
}

// --- Current book pointer ---

export async function getCurrentBookId(): Promise<string | null> {
  if (!storageOk) return null;
  try {
    return (await get<string>(CURRENT_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function setCurrentBookId(id: string | null): Promise<void> {
  if (!storageOk) return;
  try {
    if (id === null) {
      await del(CURRENT_KEY);
    } else {
      await set(CURRENT_KEY, id);
    }
  } catch {
    fail();
  }
}

// --- Removal ---

/** Delete a book everywhere: blob, progress, library entry, current pointer. */
export async function removeLibraryBook(id: string): Promise<LibraryEntry[]> {
  const library = await loadLibrary();
  const next = library.filter((e) => e.id !== id);
  await saveLibrary(next);
  if (!storageOk) return next;
  try {
    await del(BLOB_PREFIX + id);
    await del(PROGRESS_PREFIX + id);
    if ((await getCurrentBookId()) === id) {
      await del(CURRENT_KEY);
    }
  } catch {
    fail();
  }
  return next;
}

// --- Settings (unchanged behavior) ---

/** Immediate (not debounced) settings save — user preferences, low write rate. */
export async function saveSettings(settings: ReaderSettings): Promise<void> {
  if (!storageOk) return;
  try {
    await set(SETTINGS_KEY, settings);
  } catch {
    fail();
  }
}

/** Raw settings read; validated/normalized by the caller (normalizeSettings). */
export async function loadSettings(): Promise<unknown> {
  if (!storageOk) return null;
  try {
    return await get(SETTINGS_KEY);
  } catch {
    return null;
  }
}

// --- Legacy migration ---

/**
 * One-time migration of the pre-library single-book store: the old
 * `vr:book` + `vr:state` become a library entry with its progress carried
 * over, and the legacy keys are deleted. No-op when nothing to migrate.
 */
export async function migrateLegacyBook(): Promise<void> {
  if (!storageOk) return;
  try {
    const legacy = await get<StoredBlob>(LEGACY_BOOK_KEY);
    if (!legacy) return;

    const id = newId();
    const now = Date.now();
    const entry: LibraryEntry = {
      id,
      fileName: legacy.fileName,
      importWpm: legacy.importWpm,
      addedAt: now,
      lastReadAt: now,
    };

    const library = await loadLibrary();
    library.push(entry);
    await saveLibrary(library);
    await saveBookBlob(id, legacy);

    const state = await get<LegacyState>(LEGACY_STATE_KEY);
    if (state) {
      // totalWords unknown until first open — App clamps the index on restore.
      await writeProgress(id, {
        currentIndex: state.currentIndex,
        totalWords: 0,
        wpm: state.wpm,
      });
    }

    await setCurrentBookId(id);
    await del(LEGACY_BOOK_KEY);
    await del(LEGACY_STATE_KEY);
  } catch {
    fail();
  }
}

// --- Lifecycle ---

/** Bind once: flush pending progress when the page is being hidden/closed. */
export function bindLifecycle(): void {
  if (lifecycleBound || typeof window === 'undefined') return;
  lifecycleBound = true;
  window.addEventListener('pagehide', flushProgress);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushProgress();
  });
}
