import { useRef, useState, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import { parseText } from '../utils/textParser';
import { parseMarkdown } from '../utils/markdownParser';
import { parseEpub } from '../utils/epubParser';
import { parsePdf } from '../utils/pdfParser';
import { saveBook, saveStateDebounced } from '../utils/persistence';
import type { ParsedDocument } from '../types';

const ACCEPTED = '.epub,.pdf,.txt,.md';

export default function DropZone() {
  const { setDocument, wpm } = useReaderStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        let doc: ParsedDocument;

        if (ext === 'epub') {
          doc = await parseEpub(file, wpm);
        } else if (ext === 'pdf') {
          doc = await parsePdf(file, wpm);
        } else if (ext === 'md' || ext === 'markdown') {
          const text = await file.text();
          doc = parseMarkdown(text, wpm);
        } else {
          const text = await file.text();
          doc = parseText(text, wpm);
        }

        if (doc.words.length === 0) {
          throw new Error('No readable text found in file');
        }

        setDocument(doc, file.name);
        // Persist the imported book + initial state at index 0 (replaces any
        // previous book — single-key store).
        saveBook({ blob: file, fileName: file.name, importWpm: wpm });
        saveStateDebounced(0, wpm);
      } catch (e: any) {
        setError(e.message || 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    },
    [setDocument, wpm]
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
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
        <div className="text-text-muted text-sm font-mono">Loading…</div>
      </div>
    );
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
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && (
        <div className="mt-4 text-accent text-sm text-center font-mono">{error}</div>
      )}
    </div>
  );
}
