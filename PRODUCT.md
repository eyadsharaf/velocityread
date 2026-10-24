# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General readers — anyone who wants to get through books and long-form articles
faster. They bring their own documents (EPUB, PDF, Markdown, plain text), read
in focused sessions in a desktop or mobile browser, and want speed without
losing comprehension or their place. No specialized audience is targeted;
the app must serve a first-time visitor and a daily user equally well.

## Product Purpose

Velocity Read is a minimal, calm speed-reading (RSVP) app whose value comes
from doing RSVP *correctly*: ORP-anchored word positioning, evidence-based
adaptive pacing, and a dual-pane "RSVP-with-context" layout that restores
spatial layout, parafoveal preview, and the ability to regress. It exists
because most speed readers are bare RSVP with uniform timing — mechanics that
reading research says are wrong. Success means real users adopting it as their
reading tool: this is a shippable product, not a personal utility.

## Positioning

The one speed reader that is reading-science-correct *and* local-first:
- ORP anchoring and adaptive pacing (word length, function/content words,
  punctuation pauses) — evidence-based mechanics, not uniform flashing.
- RSVP-with-context: the flashing word is paired with a full-text pane and
  live caret, so readers keep spatial context and can re-read.
- Fully in-browser parsing (EPUB/PDF/Markdown/text) — documents never leave
  the client. No uploads, no accounts, no server.

Neighboring speed readers are either bare RSVP, cloud-upload services, or
ad-heavy freemium apps. The combination of correct mechanics plus local-first
privacy is the claim a neighbor could not truthfully copy without rebuilding
their core.

## Operating Context

- Documents are imported from the user's own files and parsed entirely
  client-side (`epubjs`, `pdfjs-dist`).
- Reading progress and settings persist locally (IndexedDB, `vr:*` keys) and
  hydrate before first paint; sessions survive reloads.
- Installable PWA (`vite-plugin-pwa`) — usable offline once installed.
- Environments: dark rooms (dark default) and bright/outdoor (opt-in light
  theme); desktop and mobile; touch (tap to play/pause, tap word to jump) and
  keyboard (shortcuts) are both first-class.
- Layout must hold at 320–375px widths.

## Capabilities and Constraints

Confirmed functionality:
- RSVP display with ORP-anchored words (`src/utils/orp.ts`)
- Adaptive pacing by word length, function vs. content word, numerals,
  capitalization, and punctuation (`src/utils/pacing.ts`)
- Dual-pane reader: RSVP + full-text pane with current-sentence highlight and
  live caret; focus mode collapses the text pane
- WPM control, word-size and text-size settings, theme setting — all persisted
- File import: EPUB, PDF, Markdown, plain text (`src/utils/*Parser.ts`)
- Keyboard shortcuts (`src/hooks/useKeyboardShortcuts.ts`)

Binding constraints (constitution `.specify/memory/constitution.md`):
- Reading science is non-negotiable; timing changes must cite the heuristic
  they implement; never regress to centered words or uniform pacing
- Minimal and calm: one accent color, one neutral ramp, no decorative
  gradients/glow/motion; controls auto-fade during playback
- Local-first and private: no network calls that transmit document content
- Cross-platform: single responsive codebase, touch + keyboard, 375px test
- Small stack (React 18 + TS + Vite 6 + Tailwind v4 + Zustand); additions
  must be justified; no `tailwind.config.js` (CSS-first `@theme`)
- Test-first for human-facing behavior (Vitest)

Explicitly undecided:
- Distribution and monetization model (shippable product; growth/commercial
  intent exists, no chosen channel or pricing)

## Brand Commitments

- Name: **Velocity Read**.
- Identity: "minimal, calm" — the interface must disappear so the reader can
  read; a reading app that competes for attention has failed (constitution
  Principle II).
- The visual expression of that identity (palettes, type roles, tokens) is
  governed by `DESIGN.md` and is not duplicated here.

## Evidence on Hand

None. No testimonials, usage data, benchmarks, customers, or press exist.
Future surfaces must not fabricate any claim, metric, or social proof. The
repository itself (constitution, DESIGN.md, working app) is the only evidence.

## Product Principles

1. **Reading science is the product.** Every feature preserves or extends
   evidence-based RSVP mechanics; nothing regresses them.
2. **Calm wins.** Attention belongs to the text. Chrome must earn its place,
   and decor has no place at all.
3. **Local-first and private, as a feature.** Documents never leave the
   client — say so plainly, never quietly erode it.
4. **One surface for every reader.** First-time visitor and daily user,
   touch and keyboard, phone and desktop: one responsive, accessible
   experience.
5. **Ship-ready restraint.** A small, boring stack with few dependencies,
   because this is meant to reach real users and keep working.

## Accessibility & Inclusion

Established requirements (constitution + DESIGN.md): WCAG AA contrast targets
(e.g. past-words token ≥4.5:1 on both themes), `prefers-reduced-motion`
respected (no pulse/blink/scroll easing), accent `:focus-visible` ring on all
interactive elements, keyboard-reachable drop zone, and 375px-wide layout
verification.
