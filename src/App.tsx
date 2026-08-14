import { useEffect, useState } from 'react';
import { useReaderStore } from './store/readerStore';
import EmptyState from './components/EmptyState';
import Reader from './components/Reader';
import {
  bindLifecycle,
  loadBook,
  loadState,
  saveStateDebounced,
} from './utils/persistence';
import { parseAny } from './utils/importFile';

function LoadingScreen({ restoring }: { restoring: boolean }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-base">
      <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      <div className="text-text-muted text-sm font-mono">
        {restoring ? 'Restoring last book…' : 'Loading…'}
      </div>
    </div>
  );
}

export default function App() {
  const doc = useReaderStore((s) => s.doc);
  const hydrated = useReaderStore((s) => s.hydrated);
  const [restoring, setRestoring] = useState(false);

  // Launch: restore last imported book (re-parsed with the original import WPM
  // so timing math is identical) + last position/WPM, paused, no dialogs.
  useEffect(() => {
    let cancelled = false;
    bindLifecycle();
    (async () => {
      const book = await loadBook();
      if (cancelled) return;
      if (!book) {
        useReaderStore.getState().setHydrated();
        return;
      }
      setRestoring(true);
      try {
        const state = await loadState();
        const file = new File([book.blob], book.fileName);
        const parsed = await parseAny(file, book.importWpm);
        if (cancelled) return;
        const idx = Math.min(
          state?.currentIndex ?? 0,
          Math.max(0, parsed.words.length - 1)
        );
        useReaderStore.setState({
          doc: parsed,
          fileName: book.fileName,
          currentIndex: idx,
          wpm: state?.wpm ?? book.importWpm,
          isPlaying: false,
          userScrolledAway: false,
        });
      } catch {
        // Unrestorable book (corrupt blob, parser change, …) → fresh state.
      } finally {
        if (!cancelled) {
          setRestoring(false);
          useReaderStore.getState().setHydrated();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced persistence of reading position + WPM on every change.
  useEffect(() => {
    const unsub = useReaderStore.subscribe((s, prev) => {
      if (
        s.doc &&
        (s.currentIndex !== prev.currentIndex || s.wpm !== prev.wpm)
      ) {
        saveStateDebounced(s.currentIndex, s.wpm);
      }
    });
    return unsub;
  }, []);

  if (!hydrated) return <LoadingScreen restoring={restoring} />;

  return (
    <div className="w-full h-full">
      {doc ? <Reader /> : <EmptyState />}
    </div>
  );
}
