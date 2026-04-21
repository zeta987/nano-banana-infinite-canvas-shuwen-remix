[English](README.md) | [正體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

# Infinite Canvas · GPT IMAGE 2 · Nano Banana 2 / Pro (Shuwen Remix)

An infinite-canvas creative tool with **OpenAI GPT IMAGE 2** as the flagship image engine, backed up by **Nano Banana 2 / Nano Banana Pro (Gemini 3)**. Combines prompt optimization (OpenAI Responses API or Chat Completions, and Gemini), mask-based inpainting, outpainting, webpage embedding, and a bilingual UI.

![English home view screenshot](https://github.com/user-attachments/assets/e113b2de-72e6-4ed6-b1e7-bd93fd6a7591)

![English feature overview screenshot](https://github.com/user-attachments/assets/46dd3c25-819a-4159-98a6-e1d7427d4c29)

This repository builds on the 述文老師學習網 adaptation of @Prompt_case's original work, extending it with workflow, interface, and usability updates.

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

- **GPT IMAGE 2 Support (Flagship):** Full OpenAI `gpt-image-2` integration for `/v1/images/generations` and `/v1/images/edits` (mask-based inpainting / outpainting). Supports the full parameter surface: `quality`, `output_format`, `background`, `moderation` (defaults to `low` in this app), plus every official size preset (1K / 2K / 2K landscape / 4K landscape / 4K portrait) and custom sizes matching the official constraints.
- **Aspect Ratio Matrix:** Canvas aspect-ratio picker covers 11 ratios (21:9 / 16:9 / 4:3 / 3:2 / 5:4 / 1:1 / 9:21 / 9:16 / 3:4 / 2:3 / 4:5 + auto), each mapped to a gpt-image-2 compatible resolution per tier.
- **OpenAI Text AI (Responses + Chat Completions):** Optimization & analysis can hit either `/v1/responses` (default) or `/v1/chat/completions`. Built-in model picker auto-fetches from `/v1/models`, with manual fallback for self-hosted backends.
- **Cross-Provider Credentials:** Image generation and text optimization can pick different providers without re-entering keys. Shared credentials when the providers match; dedicated input fields when they don't.
- **Nano Banana 2 / Nano Banana Pro (Gemini 3):** Still fully supported with Google Search grounding, image search, and multi-level reasoning.
- **Embedded Webpages, Generation History, Bilingual UI:** Retained and polished from the previous remix.

## Core Features

- **Infinite Canvas:** Pan, zoom, select, and arrange objects freely.
- **Rich Elements:** Add notes, arrows, drawings, shapes, images, and webpage embeds.
- **AI Image Generation:** Generate images directly from selected canvas context via any of:
  - **GPT IMAGE 2** (flagship) — OpenAI `/v1/images/generations`, with full native size coverage (1K / 2K / 4K) for every aspect ratio.
  - **Nano Banana 2 / Nano Banana Pro** (Gemini 3) — with Google Search / Image Search grounding.
  - *Note:* Nano Banana 2 supports `Minimal` and `High` thinking levels (defaults to `High`). Nano Banana Pro does not expose a configurable thinking-level option.
- **AI Text Tools:** Prompt optimization, analysis, and related text AI workflows are grouped under a dedicated text-AI section.
- **AI Editing Workflows:** Support outpainting and image-focused generation workflows.
- **Image Tools:** Crop, edit, group, align, navigate with a minimap, and use clipboard actions.
- **Session Export:** Import and export canvas state as JSON.

## AI Model Configuration Notes

### Image Models
- **GPT IMAGE 2 (OpenAI, flagship):** Fed via `/v1/images/generations` (and `/v1/images/edits` for mask-based inpainting / outpainting). Exposes `quality` (auto/low/medium/high), `output_format` (png/jpeg/webp), `background` (auto/opaque), and `moderation` (auto/low — this app defaults to `low`).
- **Nano Banana 2 / Pro (Google Gemini 3):** `gemini-3.1-flash-image-preview` and `gemini-3-pro-image-preview`, with optional Google Search / Image Search grounding.

### Text AI Models
- **OpenAI Text AI:** Switchable between `/v1/responses` (default) and `/v1/chat/completions`. Built-in model picker supports auto-fetch via `/v1/models` plus manual model name entry. Supports `none`, `low`, `medium`, `high`, and `xhigh` reasoning.
  - *Important:* When `none` is selected, the reasoning-effort parameter is omitted entirely to avoid compatibility issues with providers that do not support it.
- **Gemini Text AI:** Defaults to `High` reasoning for prompt optimization and image analysis.
- **Gemini Model Selector:**
  - **Gemini 3 Flash:** Supports `Minimal`, `Low`, `Medium`, and `High` (defaults to `High`).
  - **Gemini 3 Pro:** Supports `Low`, `Medium`, and `High` (defaults to `High`).

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
2. **Second Mod and Optimization:** 述文老師學習網
   *Contribution:* Gemini model upgrades, prompt-analysis improvements, Traditional Chinese localization, and teaching-oriented workflow refinements.
   *Link:* [Article and version overview](https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html)
3. **Current Remix:** This repository
   *Contribution:* **OpenAI GPT IMAGE 2 integration** (generation + mask-based edits + outpainting), OpenAI Responses API text AI, cross-provider credential handling, aspect-ratio matrix expansion (11 ratios × 4 tiers), Google Search grounding, webpage iframe support, generation history panel, UI refinement, and workflow tuning.

## Rights and Licensing

This repository is a **mixed-rights project**, not a single-license open-source release.

As of 2026-04-12, the public 述文老師學習網 homepage states that website articles are licensed under CC BY-NC-SA 4.0. However, the public Prompt Case Patreon pages reviewed for this project did not show a separate public software license or relicensing grant for the original Nano Banana Infinite Canvas codebase. Additionally, Creative Commons does not recommend CC licenses for software code.

See [LICENSE.md](LICENSE.md) for the current rights and attribution notice.

### Disclaimer
This repository is provided "as is", without warranty. Rights in the original, second-stage, and current remix materials remain with their respective rightsholders.
