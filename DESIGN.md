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

Dark-only. No light theme (see constitution Principle II). One **controlled red** accent —
a precise, mechanical red (`#E5484D`, hover `#FF5C5F`) that reads as an instrument/clamp
marker against near-black, instantly distinguishable from the neutral text ramp (it marks
the ORP character and the live caret). Red is intentionally used as a *signal*, not decor.
The previous `#FF3B30` was an arbitrary AI pick; the interim `#E8A33C` (amber) was replaced
per the "minimal but mechanical" direction.

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
| `--color-accent` | `#E5484D` | ORP char, caret, progress, focus ring |
| `--color-accent-bright` | `#FF5C5F` | Hover / active on accent |

These map into Tailwind v4 via `@theme` (see `src/styles/globals.css`), producing utilities
like `bg-base`, `text-text`, `text-accent`, `border-border`. **Do not hard-code hex in
components** — use tokens.

## Typography

Two roles. Both are intentional and must not be casually swapped.

| Role | Family | Where | Notes |
| --- | --- | --- | --- |
| **RSVP display** | `IBM Plex Sans` | Flashing word (`RSVPDisplay`) | Replaces Inter — Inter is flagged by Impeccable's `overused-font` rule (the #1 AI-slop typeface). IBM Plex Sans has real personality plus excellent single-glyph legibility, which matters when one word flashes at a time. |
| **Reading pane** | `IBM Plex Mono` | Full-text reader (`TextPanel`) | The mono sibling of the RSVP/UI face — same designer, same geometry. Gives the reading pane a precise, terminal/engineered feel ("minimal but mechanical") and unifies the whole type system into one family. Tuned to 15px / relaxed line-height with `tracking-tight` for body legibility. |
| **UI labels** | `IBM Plex Sans` | Controls, WPM, buttons | Same family as RSVP for cohesion. |

Fonts are **self-hosted** via `@fontsource/*` (build-time bundled) to honor the local-first
principle — no runtime network call to a font CDN.

### Type scale

| Token | Size | Use |
| --- | --- | --- |
| `--text-rsvp` | `56px` / weight 500, ORP char 700 | The flashing word |
| `--text-reader` | `15px` / relaxed line-height, `tracking-tight` | Reading pane body (monospace) |
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
- Reading pane is horizontally padded (`px-8 sm:px-16`, token scale) with a centered
  `max-w-3xl` (~768px) measure for comfortable line length; large top/bottom padding
  (`pt-[40vh]`/`pb-[50vh]`) so the centered sentence never sits at the viewport edge.

## Component Notes

Token migration complete (layout pass). No component hard-codes hex, inline font
families, or magic type sizes:

1. `RSVPDisplay.tsx` — `bg-base`, `text-text`, `text-accent`, `text-rsvp`; the `0.42` anchor
   is the named constant `ORP_ANCHOR_RATIO`.
2. `RSVPControls.tsx` — `bg-surface`, `bg-elevated`, `border-border`, `text-text`,
   `text-text-muted`.
3. `TextPanel.tsx` — `bg-surface`, `text-text` / `text-text-secondary` / `text-text-dim`,
   `bg-accent`, `font-reader` + `text-reader`.
4. `Reader.tsx` — `bg-base`, `bg-surface`.
5. `ProgressBar.tsx` — `bg-elevated`, `bg-accent`.
6. `EmptyState.tsx` / `DropZone.tsx` — `bg-base`, `text-text`, `text-text-muted`,
   `text-text-dim`, `border-border`, `bg-surface`, `text-accent`.

## Anti-slop Gate

Before committing UI changes, run:

```bash
npx impeccable detect src/
```

Target: **0 findings**. Treat any finding as a build error. Current baseline after the
Inter→IBM Plex Sans swap: 0 findings.

---

**Last updated**: 2026-08-07
