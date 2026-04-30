# Wafers, Please!

Desktop-first WebVR semiconductor inspection training prototype built with Next.js, TypeScript, and A-Frame.

## Project Overview

`Wafers, Please!` is an XR-style educational prototype focused on beginner semiconductor inspection training.  
The current build delivers a vertical slice of the core shift loop:

`inspect -> disposition -> rework flag -> debrief`

The project emphasizes training clarity and repeatability over high-fidelity industrial simulation.

## Features (Current Vertical Slice)

- Single playable shift loop with end-of-shift debrief.
- Deterministic defect generation for reproducible scenarios.
- Dual progression gates:
  - Salary gate (operational performance)
  - Competency gate (decision quality)
- Diegetic/skeuomorphic station-style UI framing.
- Accessibility profiles: default, high contrast, and large text.
- Keyboard-first decision path:
  - `A` = accept
  - `R` = reject
  - `W` = rework mark

## Tech Stack

- Next.js
- TypeScript
- A-Frame

## Getting Started

### Requirements

- Node.js 18+ (recommended)
- npm

### Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start development server.
- `npm run build` - create production build.
- `npm run start` - run production server.
- `npm run lint` - run lint checks.
- `npm run test` - run unit tests.

## Architecture

- `app/` - Next.js route and global styles.
- `src/game/` - rules, simulation, scoring, and state store.
- `src/webvr/` - A-Frame scene and custom interaction components.
- `src/ui/` - HUD and end-of-shift debrief overlays.
- `public/assets/` - local prototype assets.

## Documentation

- `webvr-wafer-inspector-gdd.md` - game design document (MVP scope and systems).
- `docs/demo-script.md` - baseline demo presentation script.
- `docs/demo-script-updated.md` - refined demo script for formal showcases.
- `docs/wafers-please-paper.md` - academic-style project paper.

## Demo Notes

- Runtime target is desktop browser first.
- A-Frame stack keeps a path open for optional WebXR expansion.
- Current MVP uses lightweight/procedural visuals for rapid iteration.

## Roadmap (Post-MVP)

- Expanded defect taxonomy and rule complexity.
- Stronger instructor-facing analytics and reporting.
- Deeper WebXR interaction support.
- Broader competency assessment workflow.