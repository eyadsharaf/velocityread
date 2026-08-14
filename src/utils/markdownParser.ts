import type { ParsedDocument } from '../types';
import { parseText } from './textParser';

/**
 * Strip Markdown syntax to plain text, preserving readable prose for RSVP.
 * Conservative: removes markup but keeps the words so speed-reading still works.
 */
function stripMarkdown(md: string): string {
  return (
    md
      // Code blocks (``` ... ```) → keep their inner text on its own paragraphs
      .replace(/```[\s\S]*?```/g, (block) =>
        block
          .replace(/^```[^\n]*\n?/gm, '')
          .replace(/```$/gm, '')
          .trim()
      )
      // Inline code `code` → code
      .replace(/`([^`]+)`/g, '$1')
      // Images ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Links [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Reference links [text][ref]
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
      // Footnote-style refs [^id]
      .replace(/\[\^[^\]]+\]/g, '')
      // ATX headings "# Heading" → "Heading"
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      // Setext headings (underlined with = or -) → drop the underline line
      .replace(/^[^\n]+\n(=+|-+)\s*$/gm, '$1\n')
      // Bold/italic markers **text**, __text__, *text*, _text_ → text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1$2')
      .replace(/(^|[^_])_([^_\s][^_]*?)_(?!_)/g, '$1$2')
      // Strikethrough ~~text~~ → text
      .replace(/~~([^~]+)~~/g, '$1')
      // Blockquotes "> quote" → quote
      .replace(/^\s{0,3}>\s?/gm, '')
      // Horizontal rules (---, ***, ___) → blank line (paragraph break)
      .replace(/^\s{0,3}([-*]){3,}\s*$/gm, '\n')
      // Unordered list markers "- ", "* ", "+ " → ""
      .replace(/^\s{0,3}[-*+]\s+/gm, '')
      // Ordered list markers "1. " → ""
      .replace(/^\s{0,3}\d+\.\s+/gm, '')
      // Task list markers "[ ] ", "[x] "
      .replace(/^\s{0,3}\[[ xX]\]\s*/gm, '')
      // HTML tags (crude) → ""
      .replace(/<[^>]+>/g, '')
      // Collapse 3+ blank lines into a paragraph break
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export function parseMarkdown(md: string, baseWPM: number = 350): ParsedDocument {
  const plain = stripMarkdown(md);
  if (!plain.trim()) {
    throw new Error('No readable text found in Markdown');
  }
  return parseText(plain, baseWPM);
}