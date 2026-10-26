import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import EmptyState from './EmptyState';
import InstallHint from './InstallHint';
import { ACCEPTED_FILES, importAndOpen, loadBookForReading } from '../utils/importFile';
import {
  loadLibrary,
  loadProgress,
  removeLibraryBook,
  setCurrentBookId,
  type StoredProgress,
} from '../utils/persistence';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function titleOf(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function typeOf(fileName: string): string {
  return (fileName.split('.').pop() ?? 'file').toUpperCase();
}

export default function LibraryScreen() {
  const library = useReaderStore((s) => s.library);
  const setLibrary = useReaderStore((s) => s.setLibrary);
  const setDocument = useReaderStore((s) => s.setDocument);
  const restoreError = useReaderStore((s) => s.restoreError);
  const setRestoreError = useReaderStore((s) => s.setRestoreError);

  const [progressMap, setProgressMap] = useState<Record<string, StoredProgress>>({});
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh the in-memory library from storage on mount — covers lastReadAt
  // touches and deletes that happened outside this component's lifetime.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadLibrary();
      if (!cancelled) useReaderStore.setState({ library: stored });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch per-book progress for the cards (parallel IndexedDB reads).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        library.map(async (e) => {
          const p = await loadProgress(e.id);
          return [e.id, p] as const;
        })
      );
      const map: Record<string, StoredProgress> = {};
      for (const [id, p] of pairs) if (p) map[id] = p;
      if (!cancelled) setProgressMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [library]);

  // Two-step delete auto-disarms after 3s so a stray armed state can't linger.
  useEffect(() => {
    if (!armedId) return;
    const t = setTimeout(() => setArmedId(null), 3000);
    return () => clearTimeout(t);
  }, [armedId]);

  const openBook = useCallback(
    async (id: string) => {
      setOpeningId(id);
      setError(null);
      try {
        const { doc, entry, progress } = await loadBookForReading(id);
        await setCurrentBookId(id);
        useReaderStore.getState().openBook(doc, entry.fileName, id, {
          index: progress?.currentIndex ?? 0,
          wpm: progress?.wpm ?? entry.importWpm,
        });
        setRestoreError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open book');
      } finally {
        setOpeningId(null);
      }
    },
    [setRestoreError]
  );

  const handleImport = useCallback(
    async (file: File) => {
      setImporting(true);
      setError(null);
      try {
        const wpm = useReaderStore.getState().wpm;
        const { doc, entry, library } = await importAndOpen(file, wpm);
        setLibrary(library);
        setDocument(doc, entry.fileName, entry.id);
        setRestoreError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load file');
      } finally {
        setImporting(false);
      }
    },
    [setLibrary, setDocument, setRestoreError]
  );

  const deleteBook = useCallback(
    async (id: string) => {
      try {
        const next = await removeLibraryBook(id);
        setLibrary(next);
      } catch {
        setError('Could not delete book');
      } finally {
        setArmedId(null);
      }
    },
    [setLibrary]
  );

  // Empty library → the import hero (drop zone) is the whole screen.
  if (library.length === 0) {
    return <EmptyState />;
  }

  const sorted = [...library].sort((a, b) => b.lastReadAt - a.lastReadAt);

  return (
    <div className="h-full overflow-y-auto bg-base">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-text text-2xl font-bold tracking-tight font-sans">
              VelocityRead
            </h1>
            <p className="text-text-muted text-sm font-mono tracking-widest uppercase mt-1">
              Library · {library.length} {library.length === 1 ? 'book' : 'books'}
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={importing}
            className="shrink-0 rounded-md border border-border bg-elevated px-4 h-10 text-text-secondary hover:text-text hover:border-text-dim transition-colors font-mono text-sm select-none disabled:opacity-60"
          >
            {importing ? 'Importing…' : '＋ Import'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FILES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
        </header>

        {(error || restoreError) && (
          <div
            role="alert"
            className="mb-4 text-accent text-sm font-mono"
          >
            {error ??
              `Couldn't restore your last book (${restoreError}) — it's still in the library below.`}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((entry) => {
            const p = progressMap[entry.id];
            const pct =
              p && p.totalWords > 0
                ? Math.min(100, ((p.currentIndex + 1) / p.totalWords) * 100)
                : null;
            const isArmed = armedId === entry.id;
            const isOpening = openingId === entry.id;

            return (
              <article
                key={entry.id}
                className={`relative rounded-md border border-border bg-surface transition-colors hover:border-text-dim hover:bg-elevated ${
                  isOpening ? 'opacity-60' : ''
                }`}
              >
                {/* Open affordance — one button, no nested interactives.
                    Delete sits outside it (absolute, top-right). */}
                <button
                  onClick={() => {
                    if (!isOpening) void openBook(entry.id);
                  }}
                  disabled={isOpening}
                  aria-label={`Open ${entry.fileName}`}
                  className="w-full text-left px-5 py-4 cursor-pointer"
                >
                  <div className="flex items-center mb-2 pr-8">
                    <span className="text-text-muted text-xs font-mono tracking-widest uppercase">
                      {typeOf(entry.fileName)}
                    </span>
                  </div>

                  <div className="text-text font-semibold tracking-tight font-sans truncate pr-4">
                    {isOpening ? 'Opening…' : titleOf(entry.fileName)}
                  </div>

                  <div className="mt-3">
                    <div className="h-[3px] rounded-full bg-elevated overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width] duration-200"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-text-muted text-xs font-mono">
                    <span>
                      {pct !== null
                        ? `${Math.round(pct)}% read`
                        : p
                        ? 'Resume'
                        : 'Unopened'}
                    </span>
                    <span>{timeAgo(entry.lastReadAt)}</span>
                  </div>
                </div>
                </button>

                <button
                  onClick={() => {
                    if (isArmed) void deleteBook(entry.id);
                    else setArmedId(entry.id);
                  }}
                  onBlur={() => {
                    if (isArmed) setArmedId(null);
                  }}
                  aria-label={isArmed ? 'Confirm delete' : 'Delete book'}
                  className={`absolute top-4 right-4 text-sm font-mono transition-colors select-none ${
                    isArmed ? 'text-accent' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {isArmed ? 'delete?' : '×'}
                </button>
              </article>
            );
          })}
        </div>

        <InstallHint />
      </div>
    </div>
  );
}
