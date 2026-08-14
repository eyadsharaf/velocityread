import { useRef, useEffect, useState } from 'react';
import { useReaderStore } from '../store/readerStore';

export default function ProgressBar() {
  const { doc, currentIndex } = useReaderStore();
  if (!doc) return null;

  const pct = doc.words.length > 0
    ? Math.min(100, ((currentIndex + 1) / doc.words.length) * 100)
    : 0;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] bg-elevated z-50">
      <div
        className="h-full bg-accent transition-all duration-150"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
