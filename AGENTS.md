# Repository Guidelines

## Project Overview

Nano Banana Infinite Canvas (Shuwen Remix) is a React 19 + TypeScript + Vite app for AI-assisted image generation on an infinite canvas. This is a mixed-rights remix project, not a single-license open source codebase, so check `LICENSE.md` before reusing or redistributing code or assets.

## Setup And Commands

- Install dependencies with `npm install`.
- Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
- Start local development with `npm run dev` on `http://localhost:3000`.
- Production checks: `npm run lint` and `npm run build`.
- Extra scripts: `npm run lint:types`, `npm run lint:eslint`, `npm run lint:eslint:fix`, `npm run format`, and `npm run format:check`.

There is no automated test suite and no CI pipeline in this repo today. Before handing work off, use `npm run lint && npm run build`. Trust `package.json` and `CLAUDE.md` over the README for script behavior; for example, `npm run lint` runs both type-checking and ESLint.

## Layout And Architecture

There is no `src/` directory. Most source files live at the repository root:

- `App.tsx`: main state owner and orchestration layer.
- `types.ts`: canvas element types and shared interfaces.
- `useHistoryState.ts`: linear undo/redo state helper.
- `components/InfiniteCanvas.tsx`: pan, zoom, selection, marquee, world/screen coordinate mapping, and canvas-level interaction bridge.
- `components/TransformableElement.tsx`: per-element rendering plus drag, resize, rotate, and iframe interaction.

The most important mental model is:

`App.tsx` state hub -> `InfiniteCanvas.tsx` interaction bridge -> `TransformableElement.tsx` renderer/editor

The canvas uses world-space coordinates rendered through CSS transforms, not an HTML5 canvas scene graph. Element `position` is the center point, and pan/zoom affects the entire world container.

## Working Norms

- Keep new imports compatible with the root alias `@/*`.
- Preserve the existing file layout unless there is a strong reason to introduce new structure.
- Prefer small, targeted changes because `App.tsx` and `InfiniteCanvas.tsx` fan out many props and callbacks.
- When touching AI flows, inspect the hardcoded model and provider branches in `App.tsx` first.
- Preserve the original comment language; if you add comments to uncommented code, use English.

## Known Gotchas

- `types.ts` defines `CanvasElement` with `iframe`, but `ElementType` does not include `'iframe'`.
- `duplicateElement` in `App.tsx` has no `iframe` branch.
- Generation cancel is soft-only; requests continue because there is no `AbortController`.
- `handleInteractionEnd` can create undo entries even when there was no visible movement.
- Images, drawings, crops, and generated outputs are stored as base64 data URLs in state, so memory usage and exported JSON size grow quickly.
- The language toggle only updates the three initial memo notes when their content still matches the original defaults.
