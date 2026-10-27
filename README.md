# VelocityRead

A speed reader that pauses at commas.

**Try it: <https://velocityread-beta.vercel.app>** — free, no account, works offline.

VelocityRead is a free, offline RSVP (rapid serial visual presentation) reader. Words flash at your pace while the full document stays in view below — so you read faster without reading worse.

## Why

The average adult reads ~238 words per minute. Most speed-reading apps sell you 1,000 — a range where the research shows comprehension measurably drops.

VelocityRead starts from the evidence instead:

- **Default: 350 WPM** — about 47% above average, a speed real readers sustain
- **Pacing engine** — not a metronome. Commas get half a beat, sentence endings one to three, paragraphs one clean gap. Long words hold longer; function words flash faster. Every rule is a setting, not a secret
- **The page stays** — your document renders below the flash, synced word-by-word. Comprehension dipped? Look down, or click any word to jump

## Features

- **RSVP display** with ORP (optimal recognition point) alignment
- **Pacing engine** with punctuation-aware pauses — toggle it off and feel the difference
- **Reading pane** rendered paragraph-true to your source file, live-synced to the current word
- **Multi-book library** — each book remembers its position and your speed for it
- **Built-in sample essay** — tap "read the sample" on the empty screen, no file needed
- **Works offline** — install it as a PWA; books are stored in your browser (IndexedDB), never uploaded
- **Formats**: EPUB · PDF · TXT · MD

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` `→` | Previous / next sentence |
| `↑` `↓` | Speed ±25 WPM |
| `Esc` | Back to library |

## Development

```bash
npm install
npm run dev        # vite dev server
npm test           # unit tests (vitest) — parser, pacing, epubjs contract
npm run test:e2e   # e2e tests (playwright) — 4 projects incl. WebKit + mobile
npm run build      # production build + PWA precache
```

Requires Node 20+.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · Zustand · pdf.js · epub.js · idb-keyval · vite-plugin-pwa

## Privacy

There is no server. Files are parsed and stored entirely in your browser — no account, no uploads, no analytics.
