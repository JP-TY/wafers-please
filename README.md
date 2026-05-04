# Wafers, Please!

Desktop-first WebVR semiconductor inspection training prototype built with Next.js, TypeScript, and A-Frame.

## Project Overview

`Wafers, Please!` is an XR-style educational prototype focused on beginner semiconductor inspection training.  
The current build delivers a vertical slice of the core shift loop:

`inspect -> disposition -> rework flag -> debrief`

The project emphasizes training clarity and repeatability over high-fidelity industrial simulation.

## Features (Current Vertical Slice)

- Start menu to choose **desktop** or **headset (WebXR)** before the shift begins.
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

## Testing WebXR without a headset

1. Use **Chromium** (Chrome or Edge).
2. Install the Chrome extension **[WebXR API Emulator](https://chromewebstore.google.com/detail/webxr-api-emulator/mjddjgeghkdiejedbbfngjacefkjnaab)** (or search the store for that name).
3. Open DevTools (**F12**), find the **WebXR** panel, pick a device (for example **Oculus Quest 2**), and enable emulation.
4. Run the app on **`http://localhost:3000`** (or HTTPS in production).
5. From the start menu choose **Play in headset (WebXR)**. Use **Enter VR** in the corner if the session does not start automatically.

Headset UI (HUD, tutorial, inspection, debrief) uses the **WebXR DOM Overlay** API via A-Frame’s `overlayElement` on `#vr-dom-ui-root`. If your browser does not grant `dom-overlay`, 2D panels may only appear on the desktop mirror, not inside the emulated headset view.

### WebXR controls (in headset)

- **Move**: push either controller **thumbstick** forward/back/side to slide along the floor (relative to where you are looking horizontally).
- **Look**: turn your head (and use **Enter VR** / browser UI to exit immersive mode when finished).
- **3D station** (Inspect / Fix / Accept / Reject): point either controller **laser** at the highlighted controls and press the **trigger** (or primary click) to select.
- **2D panels** (microscope workbench, quizzes, debrief): interact through the **DOM overlay** the same way—laser at buttons or, where supported, direct touch on the overlay.

When you start with **Play in headset (WebXR)**, the DOM overlay uses a **VR layout**: larger HUD chips, bottom-anchored tutorial with big buttons, full-width debrief actions, and a microscope panel with **tool tiles** (instead of dropdowns), **pointer-based wafer drag** (works with the laser), **Pan mode**, and **rotate nudge** buttons. Quiz answers use tall, multi-line targets sized for laser selection.

## Roadmap (Post-MVP)

- Expanded defect taxonomy and rule complexity.
- Stronger instructor-facing analytics and reporting.
- Deeper WebXR interaction support.
- Broader competency assessment workflow.