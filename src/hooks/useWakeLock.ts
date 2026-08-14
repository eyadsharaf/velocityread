import { useEffect, useRef } from 'react';

/**
 * Screen Wake Lock API wrapper. Keeps the display on while RSVP is playing.
 * Best-effort everywhere: unsupported browsers / rejections are silently ignored.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.wakeLock?.request) return;

    const acquire = async () => {
      if (sentinelRef.current) return;
      try {
        const s = await nav.wakeLock.request('screen');
        sentinelRef.current = s;
        s.addEventListener?.('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        /* silent */
      }
    };

    const release = () => {
      try {
        sentinelRef.current?.release?.();
      } catch {
        /* silent */
      }
      sentinelRef.current = null;
    };

    const onVisibility = () => {
      // OS auto-releases the lock when the page is hidden; re-acquire when back.
      if (document.visibilityState === 'visible' && active) acquire();
    };

    if (active) acquire();
    else release();

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [active]);
}
