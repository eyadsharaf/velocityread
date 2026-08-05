# Velocity Read

A minimal, calm, dark-only speed-reading (RSVP) app. React + TypeScript + Vite + Tailwind v4 + Zustand.

This project is set up for **spec-driven, design-aware** development with three tools wired together.

## The workflow: Agent + Spec Kit + Impeccable

Three layers, each with a job. All commands below are real Cline slash commands in `.clinerules/workflows/`.

| Layer | Tool | Purpose | Key files |
| --- | --- | --- | --- |
| **Process** (what & in what order) | Spec Kit | spec → plan → tasks → implement | `.specify/`, `/speckit-*` |
| **Constraints** (the rules) | Constitution + DESIGN.md | what it must obey while building | `.specify/memory/constitution.md`, `DESIGN.md` |
| **Design** (make it pretty) | Impeccable | named interventions on the UI | `/impeccable-*` + `npx impeccable detect` |

### Build a feature (Spec Kit loop)

```
/speckit-specify      I write WHAT/WHY. You approve.
/speckit-plan         I write HOW (reads DESIGN.md). You approve.
/speckit-tasks        numbered task list
/speckit-implement    I build it, obeying constitution + DESIGN.md
```

### Make it pretty (Impeccable loop)

Use these as slash commands, pointing at a target:

```
/impeccable-polish src/components/EmptyState.tsx     final quality pass
/impeccable-layout src/components/RSVPControls.tsx   spacing/rhythm
/impeccable-typeset src/components/TextPanel.tsx     type hierarchy
/impeccable-distill <surface>                        strip to the essence
/impeccable-harden <surface>                         error/edge states
/impeccable-audit src/                               a11y + perf pass
/impeccable-document                                 refresh DESIGN.md
```

Full set: `adapt, animate, audit, bolder, clarify, colorize, critique, delight, distill, document, extract, harden, init, ios, android, layout, live, onboard, optimize, overdrive, polish, quieter, shape, typeset`.

### Quality gate (always, before commit)

```bash
npx impeccable detect src/      # target: 0 findings (anti-slop build gate)
npm run build                   # must pass
```

## How Impeccable is wired (important)

Impeccable's installer targets Cursor / OpenCode / Claude Code — **not Cline**. Its skill
playbooks live in `.cursor/skills/impeccable/reference/*.md`. The `/impeccable-*` commands
in `.clinerules/workflows/` are thin wrappers that load those playbooks so they work here.
The detector (`npx impeccable detect`) is native and works regardless of agent.

## Commands to drive the agent

- Start a feature: `Run /speckit-specify for: <what you want>`
- Design pass: `/impeccable-polish <file>`, keeping dark-only and the amber accent.
- See the rules: "Show me the constitution and DESIGN.md."

## Dev

```bash
npm install
npm run dev       # start
npm run build     # build (also runs the anti-slop gate mentally)