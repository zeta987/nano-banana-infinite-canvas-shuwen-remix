[English](README.md) | [正體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

# Nano Banana Infinite Canvas (Shuwen Remix)

A third-stage remix of Nano Banana Infinite Canvas, combining an infinite canvas workflow with Gemini 3 image generation, prompt optimization, webpage embedding, and bilingual UI improvements.

![English home view screenshot](https://github.com/user-attachments/assets/e113b2de-72e6-4ed6-b1e7-bd93fd6a7591)

![English feature overview screenshot](https://github.com/user-attachments/assets/46dd3c25-819a-4159-98a6-e1d7427d4c29)

This repository builds on the Shuwen Learning Web adaptation of @Prompt_case's original work, extending it with workflow, interface, and usability updates.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## What's New in This Remix

- **Google Search Grounding:** Enrich image generation with context from Google Search and Google Image Search.
- **Embedded Webpages:** Add iframes to the canvas and use viewport or full-page context in generation workflows.
- **Generation History Panel:** Reuse recent image outputs without cluttering the main workspace.
- **Bilingual UI:** Refined English and Traditional Chinese interface coverage.
- **Reference Limit Guidance:** Added model-specific guidance for Banana 2 and Banana Pro usage limits.

## Core Features

- **Infinite Canvas:** Pan, zoom, select, and arrange objects freely.
- **Rich Elements:** Add notes, arrows, drawings, shapes, images, and webpage embeds.
- **AI Image Generation:** Generate images directly from selected canvas context.
  - *Note:* Nano Banana 2 supports `Minimal` and `High` thinking levels (defaults to `High`). Nano Banana Pro does not expose a configurable thinking-level option.
- **AI Text Tools:** Prompt optimization, analysis, and related text AI workflows are grouped under a dedicated text-AI section.
- **AI Editing Workflows:** Support outpainting and image-focused generation workflows.
- **Image Tools:** Crop, edit, group, align, navigate with a minimap, and use clipboard actions.
- **Session Export:** Import and export canvas state as JSON.

## AI Model Configuration Notes

### Text AI Models
- **Gemini Text AI:** Defaults to `High` reasoning for prompt optimization and image analysis.
- **Gemini Model Selector:** The text-AI section uses a dedicated model selector:
  - **Gemini 3 Flash:** Supports `Minimal`, `Low`, `Medium`, and `High` (defaults to `High`).
  - **Gemini 3 Pro:** Supports `Low`, `Medium`, and `High` (defaults to `High`).
- **OpenAI-Compatible Text AI:** Supports `none`, `low`, `medium`, `high`, and `xhigh`.
  - *Important:* When `none` is selected, the reasoning-effort parameter is omitted entirely to avoid compatibility issues with providers that do not support it.

### Environment Setup
- The Vite config maps `GEMINI_API_KEY` to the runtime key for the built-in Gemini provider.
- Alternate providers (like OpenAI-compatible APIs) can be configured directly inside the app UI.

## Common Commands

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run lint     # Run TypeScript type checks
npm run preview  # Preview the production build locally
```

## Windows Compatibility Note

The `migrated_prompt_history/` directory was introduced when AI Studio Build first synced this project to GitHub. Some filenames in that folder contain `:` characters, which can break native Windows checkouts. Cloning via WSL or a Linux environment is recommended.

## Credits and Lineage

This project follows a three-stage lineage:

1. **Original Creator:** Prompt_case
   *Contribution:* Core UI design, infinite canvas foundations, and element interaction workflow.
   *Links:* [Threads](https://www.threads.net/@prompt_case) | [Patreon](https://www.patreon.com/MattTrendsPromptEngineering)
2. **Second Mod and Optimization:** Shuwen Learning Web
   *Contribution:* Gemini model upgrades, prompt-analysis improvements, Traditional Chinese localization, and teaching-oriented workflow refinements.
   *Link:* [Article and version overview](https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html)
3. **Current Remix:** This repository
   *Contribution:* Google Search grounding, webpage iframe support, generation history panel, UI refinement, and workflow tuning.

## Rights and Licensing

This repository is a **mixed-rights project**, not a single-license open-source release.

As of 2026-04-12, the public Shuwen Learning Web homepage states that website articles are licensed under CC BY-NC-SA 4.0. However, the public Prompt Case Patreon pages reviewed for this project did not show a separate public software license or relicensing grant for the original Nano Banana Infinite Canvas codebase. Additionally, Creative Commons does not recommend CC licenses for software code.

See [LICENSE.md](LICENSE.md) for the current rights and attribution notice.

### Disclaimer
This repository is provided "as is", without warranty. Rights in the original, second-stage, and current remix materials remain with their respective rightsholders.
