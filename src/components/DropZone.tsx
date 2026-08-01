import { useRef, useState, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import { parseText } from '../utils/textParser';
import { parseEpub } from '../utils/epubParser';
import { parsePdf } from '../utils/pdfParser';
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
        } else {
          const text = await file.text();
          doc = parseText(text, wpm);
        }

        if (doc.words.length === 0) {
          throw new Error('No readable text found in file');
        }

        setDocument(doc, file.name);
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
      <div className="flex items-center justify-center h-full">
        <div className="text-[#E0E0E0] text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#FF3B30] bg-[#FF3B30]/5'
            : 'border-[#333] hover:border-[#555] hover:bg-[#1A1A1A]'
        }`}
      >
        <div className="text-[#E0E0E0] text-xl font-medium mb-2">
          Drop a file here
        </div>
        <div className="text-[#666] text-sm">
          EPUB, PDF, TXT, or Markdown
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
        <div className="mt-4 text-[#FF3B30] text-sm">{error}</div>
      )}
    </div>
  );
}
