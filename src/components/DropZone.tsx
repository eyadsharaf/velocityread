import { useRef, useState, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import Spinner from './Spinner';
import { ACCEPTED_FILES, importAndOpen } from '../utils/importFile';

export default function DropZone() {
  const { setDocument, setLibrary, wpm } = useReaderStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const { doc, entry, library } = await importAndOpen(file, wpm);
        setLibrary(library);
        setDocument(doc, entry.fileName, entry.id);
      } catch (e: any) {
        setError(e.message || 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    },
    [setDocument, setLibrary, wpm]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (isLoading) {
    return <Spinner label="Loading…" />;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div
        role="button"
        tabIndex={0}
        aria-label="Import a file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full border border-dashed rounded-md px-8 py-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-text-dim hover:bg-elevated'
        }`}
      >
        {/* Mechanical corner ticks */}
        <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-text-dim" />
        <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-text-dim" />
        <span className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-text-dim" />
        <span className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-text-dim" />

        <div className="text-text text-lg font-semibold mb-1 font-sans tracking-tight">
          Drop a file here
        </div>
        <div className="text-text-muted text-sm font-mono">
          or click to browse
        </div>
        <div className="text-text-muted text-xs mt-5 font-mono tracking-wider">
          EPUB · PDF · TXT · MD
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <div className="mt-4 text-accent text-sm text-center font-mono">{error}</div>
      )}
    </div>
  );
}
