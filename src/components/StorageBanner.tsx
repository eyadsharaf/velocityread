import { useState, useEffect } from 'react';
import { isStorageOk, onStorageChange } from '../utils/persistence';

/**
 * Warning strip shown when IndexedDB has failed: without it the app silently
 * runs stateless and the user's library/progress stops saving between visits.
 * Takes layout space (flow, not fixed) so it never covers reader controls.
 */
export default function StorageBanner() {
  const [ok, setOk] = useState(isStorageOk());

  useEffect(() => onStorageChange(() => setOk(isStorageOk())), []);

  if (ok) return null;

  return (
    <div
      role="alert"
      className="shrink-0 bg-accent text-white text-xs font-mono text-center py-1.5 px-4 select-none"
    >
      Storage unavailable — books and progress won't be saved between visits
    </div>
  );
}
