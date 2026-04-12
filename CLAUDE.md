# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nano Banana Infinite Canvas (Shuwen Remix) — an AI-powered infinite canvas image generator built with React 19, TypeScript, Vite, and Tailwind CSS v4. Supports Google Gemini 3 (Flash/Pro) and OpenAI for image generation, analysis, inpainting, outpainting, and prompt optimization. Bilingual UI (English / Traditional Chinese).

Mixed-rights project with three-stage lineage (Prompt Case → 述文老師學習網 → ZETA remix). Not a single-license open source project.

## Commands

```bash
npm run dev              # Vite dev server on http://localhost:3000
npm run build            # Production build → /dist/
npm run preview          # Preview production build locally
npm run lint             # TypeScript type-check + ESLint (run both)
npm run lint:types       # TypeScript type-check only (tsc --noEmit)
npm run lint:eslint      # ESLint only
npm run lint:eslint:fix  # ESLint with auto-fix
npm run format           # Prettier format all files
npm run format:check     # Prettier check without writing
```

No test suite is configured. No CI/CD pipeline exists.

## Environment Setup

Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. Vite exposes it as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` via `define` in `vite.config.ts`.

## Architecture

### File Layout — No src/ Directory

All source files live at the **project root**, not in a `src/` subdirectory:

```
App.tsx                    Main application (~4260 lines, sole state owner)
index.tsx                  React 19 bootstrap (createRoot → StrictMode → App)
index.html                 Entry point with CDN importmap for AI Studio hosting
index.css                  Single Tailwind v4 import (@import "tailwindcss")
types.ts                   TypeScript interfaces (CanvasElement union, Point, AnalysisResult)
useHistoryState.ts         Custom undo/redo hook (linear history stack)
components/
  InfiniteCanvas.tsx       Canvas rendering, pan/zoom, marquee selection (~1440 lines)
  TransformableElement.tsx Per-element interaction: drag, resize, rotate (~940 lines)
  ImageEditModal.tsx       AI inpainting with mask painting + image adjustments (~1360 lines)
  DrawingModal.tsx         Freehand drawing pad with shape tools (~700 lines)
  CropModal.tsx            Image cropping with percentage-based coordinates (~540 lines)
  ContextMenu.tsx          Right-click context menu (~410 lines)
  Minimap.tsx              HTML5 Canvas minimap with viewport indicator (~245 lines)
  GenerationPanel.tsx      Collapsible sidebar for generation history (~97 lines)
```

### State Management — Props Only, No External Store

App.tsx is the **sole state owner** (~34 state variables). No Context, Redux, or Zustand. All child components receive data and callbacks through props. InfiniteCanvas alone has 35+ props.

`useHistoryState<CanvasElement[]>` tracks canvas elements with undo/redo. Key design: `setState(value, { addToHistory: false })` performs in-place replacement (used during drag), while `{ addToHistory: true }` (default) commits a history snapshot (used on interaction end).

### Coordinate System

The canvas uses **world-space coordinates** for element positions and **CSS transforms** for rendering (not HTML5 Canvas or WebGL).

- Element `position` is the **center point**; rendered with `translate(-50%, -50%)`
- World-to-screen: `screenX = worldX * zoom + pan.x`
- Screen-to-world: `worldX = (screenX - pan.x) / zoom`
- Initial state: world origin maps to canvas center (`pan = { x: width/2, y: height/2 }`)
- Zoom range: 0.1 to 5, with mouse/touch position as zoom center

The entire world is a single `<div>` with `transform: translate(${pan.x}px, ${pan.y}px) scale(${zoom})` and `transform-origin: 0 0`.

### Element Data Model

Discriminated union on `type` field. `BaseElement` provides: `id`, `position` (center Point), `width`, `height`, `rotation` (degrees), `zIndex`, optional `groupId`.

Types: `note` (content, color, textAlign), `image` (src as base64 data URL), `arrow` (start/end Points, color), `drawing` (src as base64 data URL), `iframe` (url, isActivated, sourceMode).

Element IDs use `${Date.now()}-${random7chars}`. Group IDs use `group-${Date.now()}`.

### AI Integration

All AI model names are **hardcoded** in App.tsx (no config abstraction):

| Purpose | Model |
|---------|-------|
| Image generation (Flash) | `gemini-3.1-flash-image-preview` |
| Image generation (Pro) | `gemini-3-pro-image-preview` |
| Analysis / Optimization | `gemini-3-flash-preview` or `gemini-3.1-pro-preview` |
| Inpainting / Outpainting | `gemini-2.5-flash-image` |
| Error explanation / Translation | `gemini-3-flash-preview` |
| OpenAI generation | `gpt-image-1.5` (via raw fetch, no SDK) |

Generation pipeline: validate API key → gather selected elements (notes as text, images as base64, iframes as context) → branch by provider → parallel `Promise.all` for multiple images → store base64 data URLs in `generationHistory`.

### CDN Import Map (Dual-Track Loading)

`index.html` contains an `importmap` pointing react, react-dom, and @google/genai to `aistudiocdn.com`. This enables the app to run inside Google AI Studio. In local dev, Vite resolves these from `node_modules` instead.

### Translation System

Inline `translations` object (~200+ keys) with `t(key)` callback passed via props. No i18n library. Language toggle switches between `'en'` and `'zh'`.

## Code Style

- **Prettier**: single quotes, semicolons required
- **ESLint**: flat config, `@typescript-eslint/no-explicit-any` is off, `no-empty` allows empty catch blocks
- **Tailwind CSS v4**: no `tailwind.config.*` file — uses `@tailwindcss/vite` plugin directly
- **Path alias**: `@/*` resolves to project root (both in tsconfig.json and vite.config.ts)
- **Format on save** configured in `.vscode/settings.json` (Prettier + ESLint auto-fix)

## Known Gotchas

- `ElementType` in `types.ts` is `'note' | 'image' | 'arrow' | 'drawing'` — missing `'iframe'`. The `IFrameElement` exists in the `CanvasElement` union but not in `ElementType`.
- `duplicateElement` in App.tsx has no case for `iframe` — the default branch silently returns without duplicating.
- Generation cancel is **soft**: sets a flag but does not use `AbortController`, so API requests continue until response arrives.
- All images (generated, drawn, cropped) are stored as **base64 data URLs** in state. Memory usage grows with canvas size; export/import JSON can be very large.
- Multi-element drag freezes start positions in a ref on first frame. The freeze snapshot won't reflect elements added/removed during drag.
- `handleInteractionEnd` always commits a history snapshot even for zero-delta clicks, creating undo steps with no visible change.
- Language toggle only updates the three initial memo notes (id 1/2/3), and only if their content still matches the original constant strings.
