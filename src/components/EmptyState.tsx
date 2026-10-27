import { useState } from 'react';
import DropZone from './DropZone';
import { useReaderStore } from '../store/readerStore';
import { importAndOpen } from '../utils/importFile';
import { sampleFile } from '../utils/sampleText';

export default function EmptyState() {
  const { setDocument, setLibrary, wpm } = useReaderStore();
  const [loadingSample, setLoadingSample] = useState(false);

  // Same path as a dropped file: parse, persist, open. The sample is an
  // in-memory constant, so failure is not a real state — just restore.
  const openSample = async () => {
    if (loadingSample) return;
    setLoadingSample(true);
    try {
      const { doc, entry, library } = await importAndOpen(sampleFile(), wpm);
      setLibrary(library);
      setDocument(doc, entry.fileName, entry.id);
    } catch {
      setLoadingSample(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-base">
      <div className="flex flex-col items-center gap-2 mb-12">
        <h1 className="text-text text-3xl font-bold tracking-tight font-sans">
          VelocityRead
        </h1>
        <p className="text-text-muted text-sm font-mono tracking-widest uppercase">
          Speed-read anything
        </p>
      </div>
      <DropZone />
      <div className="mt-6 text-text-muted text-sm font-mono text-center">
        {loadingSample ? (
          'Loading…'
        ) : (
          <>
            No file handy?{' '}
            <button
              onClick={openSample}
              className="underline underline-offset-4 hover:text-text transition-colors"
            >
              read the sample
            </button>
          </>
        )}
      </div>
    </div>
  );
}
