# Velocity Read — Design System

> Canonical visual system. Maintained in the Impeccable / Google Stitch format.
> Read this before any UI change. The constitution (`.specify/memory/constitution.md`)
> is the parent document; this file governs the visual layer.

## Identity

Velocity Read is a **minimal, calm, dark-only speed-reading app**. The interface must
disappear so the reader can read. There is exactly **one accent color** and **one neutral
ramp**. Typography is the product — two type roles with distinct jobs.

This is a *tool/utility surface*, not a marketing surface. Most of Impeccable's landing-page
anti-patterns (hero gradients, pricing cards, "AI beige" marketing palettes) do not apply.
What *does* apply: type discipline, token discipline, restraint, and no decorative motion.

## Color

Dark-only. No light theme (see constitution Principle II). One warm amber accent — chosen
because it reads as a reading-lamp / highlighter warmth against near-black, is instantly
distinguishable from the neutral text ramp (important — it marks the ORP character and the
live caret), and is **not** the generic AI red/blue/purple. The previous `#FF3B30` was an
arbitrary AI pick and felt alarming for a calm app.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-base` | `#121212` | App background, RSVP pane |
| `--color-surface` | `#1A1A1A` | Reading pane, controls, cards |
| `--color-elevated` | `#222222` | Hover / raised states |
| `--color-border` | `#333333` | Hairline borders |
| `--color-text` | `#E6E6E6` | Primary text (RSVP word, current reading word) |
| `--color-text-secondary` | `#A6A6A6` | Secondary text, labels |
| `--color-text-muted` | `#888888` | Muted (WPM readout, dim UI) |
| `--color-text-dim` | `#6E6E6E` | Past / read words in the reading pane |
| `--color-accent` | `#E8A33C` | ORP char, caret, progress, focus ring |
| `--color-accent-bright` | `#F5B85C` | Hover / active on accent |

These map into Tailwind v4 via `@theme` (see `src/styles/globals.css`), producing utilities
like `bg-base`, `text-text`, `text-accent`, `border-border`. **Do not hard-code hex in
components** — use tokens.

## Typography

Two roles. Both are intentional and must not be casually swapped.

| Role | Family | Where | Notes |
| --- | --- | --- | --- |
| **RSVP display** | `IBM Plex Sans` | Flashing word (`RSVPDisplay`) | Replaces Inter — Inter is flagged by Impeccable's `overused-font` rule (the #1 AI-slop typeface). IBM Plex Sans has real personality plus excellent single-glyph legibility, which matters when one word flashes at a time. |
| **Reading pane** | `Georgia, serif` | Full-text reader (`TextPanel`) | A deliberate editorial serif. Universal, screen-optimized, not flagged. Optional future upgrade: Newsreader (self-hosted). |
| **UI labels** | `IBM Plex Sans` | Controls, WPM, buttons | Same family as RSVP for cohesion. |

Fonts are **self-hosted** via `@fontsource/*` (build-time bundled) to honor the local-first
principle — no runtime network call to a font CDN.

### Type scale

| Token | Size | Use |
| --- | --- | --- |
| `--text-rsvp` | `56px` / weight 500, ORP char 700 | The flashing word |
| `--text-reader` | `17px` / 1.5 line-height | Reading pane body |
| `--text-ui` | `14px` | Controls / labels |
| `--text-sm` | `12px` | Minor metadata |

## Spacing & Radius

4px base scale: `2 · 4 · 8 · 12 · 16 · 24 · 32 · 48`. No off-scale magic numbers.

| Token | Value |
| --- | --- |
| `--radius-sm` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-full` | `9999px` (pills, round buttons) |

## Motion

Motion must serve readability, never decorate.

- Controls fade on a 300ms opacity ease during playback; return on input. Keep.
- Reading pane uses `smooth` scroll to center the current sentence. Keep.
- The caret uses a 1s blink. Keep.
- **No** decorative transitions, glows, pulsing dots, or hover-scale on static elements
  (these are common Impeccable-flagged "tells").

## Layout

- Two-pane vertical split: RSVP (top 50%) + reading pane (bottom 50%).
- Responsive: must hold at 375px width (stack testing noted in constitution Principle IV).
- Reading pane is horizontally padded (~10%) with a centered `max-w-2xl` measure for
  comfortable line length; large top/bottom padding so the centered sentence never sits at
  the viewport edge.

## Component Notes (current debt to retire)

These are the token-migration follow-ups (do via `/speckit-implement`, not urgent):

1. `RSVPDisplay.tsx` — hard-coded `#121212`, `#FF3B30`, `#E0E0E0`, `#888`, `56px`, `0.42`.
   Migrate to `bg-base`, `text-accent`, `text-text`, `text-rsvp`. Keep the 0.42 anchor as a
   named constant (`ORP_ANCHOR_RATIO`) rather than a token.
2. `RSVPControls.tsx` — hard-coded `#1A1A1A`, `#2A2A2A`, `#333`, `#E0E0E0`, `#888`.
3. `TextPanel.tsx` — hard-coded `#1A1A1A`, `#D0D0D0`, `#FF3B30`, `#FFFFFF`, `#777`, inline
   `17px` Georgia.
4. `Reader.tsx` — hard-coded `#121212`, `#1A1A1A`.

## Anti-slop Gate

Before committing UI changes, run:

```bash
npx impeccable detect src/
```

Target: **0 findings**. Treat any finding as a build error. Current baseline after the
Inter→IBM Plex Sans swap: 0 findings.

---

**Last updated**: 2026-08-03