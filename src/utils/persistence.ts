import { get, set } from 'idb-keyval';
import type { ReaderSettings } from '../store/readerStore';

/**
 * IndexedDB persistence for the last imported book + reading position.
 * All operations are best-effort: the first IDB failure flips a permanent
 * `storageOk = false` flag and the app silently runs stateless from then on.
 */

const BOOK_KEY = 'vr:book';
const STATE_KEY = 'vr:state';
const SETTINGS_KEY = 'vr:settings';

export interface StoredBook {
  blob: Blob;
  fileName: string;
  importWpm: number;
}

export interface StoredState {
  currentIndex: number;
  wpm: number;
}

let storageOk = true;
let stateTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: StoredState | null = null;
let lifecycleBound = false;

function fail() {
  storageOk = false;
}

export function isStorageOk(): boolean {
  return storageOk;
}

export async function saveBook(book: StoredBook): Promise<void> {
  if (!storageOk) return;
  try {
    await set(BOOK_KEY, book);
  } catch {
    fail();
  }
}

async function writeState(s: StoredState): Promise<void> {
  if (!storageOk) return;
  try {
    await set(STATE_KEY, s);
  } catch {
    fail();
  }
}

/** Debounced (500ms) position/WPM save — called on every progress tick. */
export function saveStateDebounced(currentIndex: number, wpm: number): void {
  if (!storageOk) return;
  pendingState = { currentIndex, wpm };
  if (stateTimer) clearTimeout(stateTimer);
  stateTimer = setTimeout(() => {
    stateTimer = null;
    if (pendingState) void writeState(pendingState);
  }, 500);
}

/** Immediate flush of any pending debounced state (pagehide / hidden). */
export function flushState(): void {
  if (stateTimer) {
    clearTimeout(stateTimer);
    stateTimer = null;
  }
  if (pendingState && storageOk) {
    void writeState(pendingState);
  }
}

export async function loadBook(): Promise<StoredBook | null> {
  if (!storageOk) return null;
  try {
    return (await get<StoredBook>(BOOK_KEY)) ?? null;
  } catch {
    fail();
    return null;
  }
}

export async function loadState(): Promise<StoredState | null> {
  if (!storageOk) return null;
  try {
    return (await get<StoredState>(STATE_KEY)) ?? null;
  } catch {
    return null;
  }
}

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

/** Bind once: flush pending state when the page is being hidden/closed. */
export function bindLifecycle(): void {
  if (lifecycleBound || typeof window === 'undefined') return;
  lifecycleBound = true;
  window.addEventListener('pagehide', flushState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushState();
  });
}
