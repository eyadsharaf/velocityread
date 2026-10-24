# Velocity Read — Design System

> Canonical visual system. Maintained in the Impeccable / Google Stitch format.
> Read this before any UI change. The constitution (`.specify/memory/constitution.md`)
> is the parent document; this file governs the visual layer.

## Identity

Velocity Read is a **minimal, calm speed-reading app with a dark default theme and a
tokenized light theme** (opt-in user setting — constitution Amendment v1.1.0). The
interface must disappear so the reader can read. There is exactly **one accent color** and
**one neutral ramp** per theme. Typography is the product — two type roles with distinct jobs.

This is a *tool/utility surface*, not a marketing surface. Most of Impeccable's landing-page
anti-patterns (hero gradients, pricing cards, "AI beige" marketing palettes) do not apply.
What *does* apply: type discipline, token discipline, restraint, and no decorative motion.

## Color

Dark default + tokenized light theme (constitution Amendment v1.1.0). One **controlled red**
accent per theme — a precise, mechanical red that reads as an instrument/clamp marker,
instantly distinguishable from the neutral text ramp (it marks the ORP character and the
live caret). Red is intentionally used as a *signal*, not decor. The previous `#FF3B30` was
an arbitrary AI pick; the interim `#E8A33C` (amber) was replaced per the "minimal but
mechanical" direction.

### Dark tokens (default) — `@theme` in `src/styles/globals.css`

| Token | Value | Use |
| --- | --- | --- |
| `--color-base` | `#121212` | App background, RSVP pane |
| `--color-surface` | `#1A1A1A` | Reading pane, controls, cards |
| `--color-elevated` | `#222222` | Hover / raised states |
| `--color-border` | `#333333` | Hairline borders |
| `--color-text` | `#E6E6E6` | Primary text (RSVP word, current reading word) |
| `--color-text-secondary` | `#A6A6A6` | Secondary text, labels |
| `--color-text-muted` | `#888888` | Muted (WPM readout, dim UI) |
| `--color-text-dim` | `#828282` | Past / read words (≈4.5:1 on surface, AA) |
| `--color-accent` | `#E5484D` | ORP char, caret, progress, focus ring |
| `--color-accent-bright` | `#FF5C5F` | Hover / active on accent |
| `--color-row-active` | `rgba(255,255,255,0.08)` | Active sentence row highlight |

### Light tokens — `:root[data-theme="light"]` overrides

Same utility names; only the CSS vars re-resolve. The accent deepens to keep
white-on-accent ≥4.5:1; `accent-bright` is the dark theme's base red.

| Token | Value | Use |
| --- | --- | --- |
| `--color-base` | `#FAFAF9` | App background, RSVP pane |
| `--color-surface` | `#FFFFFF` | Reading pane, controls, cards |
| `--color-elevated` | `#F0F0EE` | Hover / raised states |
| `--color-border` | `#E2E2DF` | Hairline borders |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-text-secondary` | `#444444` | Secondary text, labels |
| `--color-text-muted` | `#5F5F5F` | Muted (WPM readout, dim UI) |
| `--color-text-dim` | `#6E6E6E` | Past / read words (≈5.1:1 on white, AA) |
| `--color-accent` | `#D63A3F` | ORP char, caret, progress, focus ring |
| `--color-accent-bright` | `#E5484D` | Hover / active on accent |
| `--color-row-active` | `rgba(0,0,0,0.05)` | Active sentence row highlight |

The active theme is applied by `App.tsx` via `document.documentElement.dataset.theme`,
which also syncs `color-scheme` and the `<meta name="theme-color">` (token-derived).

These map into Tailwind v4 via `@theme` (see `src/styles/globals.css`), producing utilities
like `bg-base`, `text-text`, `text-accent`, `border-border`. **Do not hard-code hex in
components** — use tokens. Theme overrides must stay **outside** `@theme` (plain
`:root[data-theme=...]` rules) so utilities re-resolve the vars at runtime.

## Typography

Two roles. Both are intentional and must not be casually swapped.

| Role | Family | Where | Notes |
| --- | --- | --- | --- |
| **RSVP display** | `IBM Plex Sans` | Flashing word (`RSVPDisplay`) | Replaces Inter — Inter is flagged by Impeccable's `overused-font` rule (the #1 AI-slop typeface). IBM Plex Sans has real personality plus excellent single-glyph legibility, which matters when one word flashes at a time. |
| **Reading pane** | `IBM Plex Mono` | Full-text reader (`TextPanel`) | The mono sibling of the RSVP/UI face — same designer, same geometry. Gives the reading pane a precise, terminal/engineered feel ("minimal but mechanical") and unifies the whole type system into one family. Tuned to 16px / line-height 1.7 with `tracking-tight` for body legibility; size is a user setting (`--reader-font-size`, S/M/L = 14/16/18). |
| **UI labels** | `IBM Plex Sans` | Controls, WPM, buttons | Same family as RSVP for cohesion. |

Fonts are **self-hosted** via `@fontsource/*` (build-time bundled) to honor the local-first
principle — no runtime network call to a font CDN.

### Type scale

| Token | Size | Use |
| --- | --- | --- |
| `--text-rsvp` | `clamp(28px, min(9.5vw, 22dvh), 56px)` × `var(--rsvp-scale, 1)` / weight 500, ORP char 700 | The flashing word — fluid, no fixed media-query steps. `--rsvp-scale` is the user word-size setting (S/M/L/XL = 0.85/1/1.15/1.3), set inline by `RSVPDisplay`. ORP math is DOM-measured, so fluid sizing is safe. |
| `--text-reader` | `16px` / line-height 1.7, `tracking-tight` | Reading pane body (monospace); effective size overridden per-setting via `--reader-font-size` |
| `--text-ui` | `14px` | Controls / labels |
| `--text-sm` | `12px` | Minor metadata |

## Spacing & Radius

4px base scale: `2 · 4 · 8 · 12 · 16 · 24 · 32 · 48`. No off-scale magic numbers.

| Token | Value |
| --- | --- |
| `--radius-sm` | `4px` |
| `--radius-lg` | `6px` |
| `--radius-full` | `9999px` (pills, round buttons) |

## Motion

Motion must serve readability, never decorate.

- Controls fade on a 300ms opacity ease during playback; return on input. Keep.
- Reading pane uses `smooth` scroll to center the current sentence. Keep.
- The caret uses a 1s blink. Keep.
- `prefers-reduced-motion: reduce`: `wpm-pulse`, `caret-blink` and `fade-in` animations
  are disabled, the controls fade becomes instant, and sentence auto-scroll jumps
  (`auto` behavior) instead of easing.
- Theme switches cross-fade via a 150ms `transition-colors` on the two reading panes only —
  no global `*` transitions.
- **No** decorative transitions, glows, pulsing dots, or hover-scale on static elements
  (these are common Impeccable-flagged "tells").

## Layout

- Two-pane vertical split: RSVP (flex `basis-1/2`, `min-h-[240px]`) + reading pane
  (`flex-1`, `min-h-[160px]`); focus mode (settings toggle) collapses the reading pane and
  the RSVP pane becomes full height. ProgressBar stays `fixed` on top.
- Responsive: must hold at 320px width — the controls pill steps its tap-target sizes down
  below 380px/430px and hides the " WPM" suffix below 430px so it never overflows.
- Reading pane is horizontally padded (`px-6 sm:px-16`, token scale) with a centered
  `max-w-3xl` (~768px) measure for comfortable line length; large top/bottom padding
  (`pt-[40vh]`/`pb-[50vh]`) so the centered sentence never sits at the viewport edge.

## Component Notes

Token migration complete (layout pass). No component hard-codes hex, inline font
families, or magic type sizes:

1. `RSVPDisplay.tsx` — `bg-base`, `text-text`, `text-accent`, `text-rsvp`; the `0.42` anchor
   is the named constant `ORP_ANCHOR_RATIO`. The "Tap to resume" overlay (`z-10`) handles its
   own tap: clears the scroll-away flag **and** resumes playback.
2. `RSVPControls.tsx` — `bg-elevated/90` pill, `border-border`, `text-text`,
   `text-text-muted`. The controls wrapper in `Reader.tsx` sits at `z-20` so the pill stays
   clickable above the resume overlay. The play button mirrors the overlay (clear + resume).
   Ends with a settings gear (`data-settings-toggle`).
3. `TextPanel.tsx` — `bg-surface`, `text-text` / `text-text-secondary` / `text-text-dim`,
   `bg-row-active` (theme-aware active sentence), `bg-accent`,
   `font-reader` + `text-reader`; thin tokenized scrollbar; size driven by
   `--reader-font-size`.
4. `Reader.tsx` — `bg-base`, `bg-surface`; flex pane split with min-heights; owns the
   settings-popover open state (while open, controls never auto-fade).
5. `ProgressBar.tsx` — `bg-elevated`, `bg-accent`.
6. `SettingsPopover.tsx` — anchored above the pill; `bg-elevated`, `border-border`,
   `radius-lg`, pill-like shadow; segmented controls (`aria-pressed`) + focus-mode switch
   (`role="switch"`); Escape / outside-click closes.
7. `EmptyState.tsx` / `DropZone.tsx` — `bg-base`, `text-text`, `text-text-muted`,
   `text-text-dim`, `border-border`, `bg-surface`, `text-accent`; the drop zone is keyboard-
   reachable (`role="button"`, Enter/Space) — the global `:focus-visible` rule paints the
   accent focus ring on all interactive elements.

## Anti-slop Gate

Before committing UI changes, run:

```bash
npx impeccable detect src/
```

Target: **0 findings**. Treat any finding as a build error. Current baseline after the
Inter→IBM Plex Sans swap: 0 findings.

---

**Last updated**: 2026-08-15
