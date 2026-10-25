import { useEffect, useState } from 'react';
import { normalizeSettings, useReaderStore } from './store/readerStore';
import LibraryScreen from './components/LibraryScreen';
import Reader from './components/Reader';
import StorageBanner from './components/StorageBanner';
import {
  bindLifecycle,
  getCurrentBookId,
  loadLibrary,
  loadSettings,
  migrateLegacyBook,
  removeLibraryBook,
  saveProgressDebounced,
  saveSettings,
  setCurrentBookId,
} from './utils/persistence';
import { loadBookForReading } from './utils/importFile';

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
  const theme = useReaderStore((s) => s.settings.theme);
  const [restoring, setRestoring] = useState(false);

  // Apply the active theme: data-theme attr drives token overrides, plus
  // color-scheme and the mobile-chrome theme-color meta (token-derived).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const base = getComputedStyle(root).getPropertyValue('--color-base').trim();
    if (base) {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', base);
    }
  }, [theme]);

  // Launch: settings → legacy migration → library → last-read book (re-parsed
  // with the original import WPM so timing math is identical) + saved position
  // and per-book WPM, paused, no dialogs.
  useEffect(() => {
    let cancelled = false;
    bindLifecycle();
    (async () => {
      const storedSettings = await loadSettings();
      if (cancelled) return;
      if (storedSettings) {
        useReaderStore.setState({ settings: normalizeSettings(storedSettings) });
      }

      await migrateLegacyBook();

      const library = await loadLibrary();
      if (cancelled) return;
      useReaderStore.setState({ library });

      const currentId = await getCurrentBookId();
      if (cancelled) return;
      if (!currentId) {
        useReaderStore.getState().setHydrated();
        return;
      }

      setRestoring(true);
      try {
        const { doc, entry, progress } = await loadBookForReading(currentId);
        if (cancelled) return;
        const idx = Math.min(
          progress?.currentIndex ?? 0,
          Math.max(0, doc.words.length - 1)
        );
        useReaderStore.setState({
          doc,
          fileName: entry.fileName,
          currentBookId: entry.id,
          currentIndex: idx,
          wpm: progress?.wpm ?? entry.importWpm,
          isPlaying: false,
          userScrolledAway: false,
        });
      } catch {
        // Unrestorable book (corrupt blob, parser change, …) → drop it from
        // the library and land on the library screen instead of a dead end.
        const next = await removeLibraryBook(currentId);
        if (!cancelled) useReaderStore.setState({ library: next });
        await setCurrentBookId(null);
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

  // Debounced per-book persistence of reading position + WPM; immediate
  // persistence of settings (preferences, not progress — no debounce needed).
  useEffect(() => {
    const unsub = useReaderStore.subscribe((s, prev) => {
      if (s.settings !== prev.settings) {
        saveSettings(s.settings);
      }
      if (
        s.doc &&
        s.currentBookId &&
        (s.currentIndex !== prev.currentIndex || s.wpm !== prev.wpm)
      ) {
        saveProgressDebounced(s.currentBookId, {
          currentIndex: s.currentIndex,
          totalWords: s.doc.totalWords,
          wpm: s.wpm,
        });
      }
    });
    return unsub;
  }, []);

  // Leaving the page mid-read: flush the pending per-book progress write.
  // (bindLifecycle covers pagehide/visibilitychange; nothing more needed here.)

  if (!hydrated) return <LoadingScreen restoring={restoring} />;

  return (
    <div className="w-full h-full flex flex-col">
      <StorageBanner />
      <div className="flex-1 min-h-0">
        {doc ? <Reader /> : <LibraryScreen />}
      </div>
    </div>
  );
}
