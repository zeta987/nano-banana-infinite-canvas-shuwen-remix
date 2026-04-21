[English](README.md) | [正體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

# 無限畫布 · GPT IMAGE 2 · Nano Banana 2 / Pro (進階強化版)

以 **OpenAI GPT IMAGE 2** 作為旗艦生圖引擎、搭配 **Nano Banana 2 / Nano Banana Pro (Gemini 3)** 的無限畫布創作工具。整合 OpenAI Responses API / Chat Completions 的提示詞最佳化、蒙版 inpainting、outpainting、網頁嵌入與中英文雙語介面。

![繁體中文首頁示意圖](https://github.com/user-attachments/assets/39f625f5-09ac-4848-b914-15d7c7fb48a8)

![繁體中文功能示意圖](https://github.com/user-attachments/assets/8362b8b9-bafb-4b86-bd9f-51691d811b92)

本專案建立在述文老師學習網改編版之上，延續原作的操作概念，並加入這個 Remix 版本的功能擴充、介面調整與流程最佳化。

## 快速開始

**環境需求：** Node.js

1. 安裝相依套件：
   ```bash
   npm install
   ```

2. 參考 `.env.example` 建立 `.env.local`，並填入 API 金鑰：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 本次升級新增功能

- **GPT IMAGE 2 支援（旗艦）：** 完整串接 OpenAI `gpt-image-2` 的 `/v1/images/generations` 與 `/v1/images/edits`（支援蒙版 inpainting 與 outpainting）。完整暴露所有參數：`quality`、`output_format`、`background`、`moderation`（本專案預設為 `low`），並涵蓋官方全部尺寸 preset（1K / 2K / 2K landscape / 4K landscape / 4K portrait）以及符合官方約束的自訂尺寸。
- **比例矩陣擴充：** 畫布比例選單涵蓋 11 種（21:9 / 16:9 / 4:3 / 3:2 / 5:4 / 1:1 / 9:21 / 9:16 / 3:4 / 2:3 / 4:5 + auto），每種在各 tier 下都會映射為合法的 gpt-image-2 尺寸。
- **OpenAI 文字 AI（Responses + Chat Completions）：** 提示最佳化與分析可選擇 `/v1/responses`（預設）或 `/v1/chat/completions`。內建模型選單透過 `/v1/models` 自動獲取，也可手動輸入模型名稱（適用自架 backend）。
- **跨 provider 憑證處理：** 生圖與文字最佳化可選用不同 provider 而不需重複輸入 key；provider 相同時共用憑證，不同時顯示專用輸入欄位。
- **Nano Banana 2 / Nano Banana Pro（Gemini 3）：** 原有功能完整保留，支援 Google Search grounding、圖片搜尋與多段 reasoning。
- **網頁嵌入、生成歷史面板、雙語介面：** 延續並潤飾前版。

## 核心功能

- **無限畫布：** 支援平移、縮放、框選與多物件自由排版。
- **多樣化元素：** 可加入便利貼、箭頭、幾何圖形、手繪內容、圖片與網頁嵌入物件。
- **AI 影像生成：** 可直接使用選取的畫布內容作為上下文生成新圖片，支援以下引擎：
  - **GPT IMAGE 2**（旗艦） — OpenAI `/v1/images/generations`，涵蓋 1K / 2K / 4K 各比例的原生尺寸。
  - **Nano Banana 2 / Nano Banana Pro**（Gemini 3）— 搭配 Google Search / 圖片搜尋 grounding。
  - *註：* Nano Banana 2 支援 `Minimal` 與 `High` 思考層級（預設為 `High`）；Nano Banana Pro 不支援調整思考層級。
- **文字 AI 工具：** 提示最佳化、分析等功能已整合在獨立的「文字 AI」區塊中。
- **AI 影像編輯：** 支援外擴生成與其他偏影像處理的工作流程。
- **編輯與整理工具：** 包含裁切、編修、群組、對齊、小地圖導覽與剪貼簿操作。
- **工作階段儲存：** 支援將畫布狀態匯出與匯入為 JSON 格式。

## AI 模型設定說明

### 影像模型
- **GPT IMAGE 2（OpenAI，旗艦）：** 透過 `/v1/images/generations` 生圖、`/v1/images/edits` 做蒙版 inpainting 與 outpainting。暴露 `quality`（auto/low/medium/high）、`output_format`（png/jpeg/webp）、`background`（auto/opaque）、`moderation`（auto/low，本專案預設 `low`）。
- **Nano Banana 2 / Pro（Google Gemini 3）：** `gemini-3.1-flash-image-preview` 與 `gemini-3-pro-image-preview`，支援 Google Search / 圖片搜尋 grounding。

### 文字 AI 模型
- **OpenAI 文字 AI：** 可切換 `/v1/responses`（預設）或 `/v1/chat/completions`。內建模型選單透過 `/v1/models` 自動獲取，也可手動輸入模型名稱。支援 `none`、`low`、`medium`、`high`、`xhigh` reasoning。
  - *重要：* 當選擇 `none` 時，系統會直接不傳遞 reasoning-effort 參數，以避免部分不支援此參數的相容模型發生錯誤。
- **Gemini 文字 AI：** 進行提示最佳化與圖片分析等功能時，在 Gemini API 模式下預設採用 `High` 思維。
- **Gemini 模型下拉選單：**
  - **Gemini 3 Flash：** 支援 `Minimal`、`Low`、`Medium`、`High`（預設為 `High`）。
  - **Gemini 3 Pro：** 支援 `Low`、`Medium`、`High`（預設為 `High`）。

### 環境設定
- 本專案透過 Vite 設定，將 `GEMINI_API_KEY` 對映為內建 Gemini 流程使用的執行期金鑰。
- 若要改用自訂 Gemini 或 OpenAI 相容服務，可直接於應用程式介面中設定對應參數。

## 常用指令

```bash
npm run dev      # 啟動開發伺服器
npm run build    # 編譯正式版本
npm run lint     # 執行 TypeScript 型別檢查
npm run preview  # 預覽編譯後的版本
```

## Windows 注意事項

`migrated_prompt_history/` 目錄是在 AI Studio Build 首次同步到 GitHub 時引入的。由於其中部分檔案名稱包含 `:` 字元，會導致 Windows 原生檔案系統無法正常 checkout。若要乾淨地完整 clone，建議使用 WSL 或 Linux 環境。

## 傳承與貢獻聲明

本專案的發展歷程可分為三個階段：

1. **原創作者：** Prompt_case
   *貢獻：* 核心 UI 設計、無限畫布基礎架構、物件互動邏輯。
   *連結：* [Threads](https://www.threads.net/@prompt_case) | [Patreon](https://www.patreon.com/MattTrendsPromptEngineering)
2. **二次創作與最佳化：** 述文老師學習網
   *貢獻：* Gemini 模型升級、提示詞分析最佳化、繁體中文在地化，以及偏向教學情境的流程調整。
   *連結：* [教學文章與版本介紹](https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html)
3. **目前版本：** 本專案 Remix 版
   *貢獻：* **串接 OpenAI GPT IMAGE 2**（生圖 + 蒙版編輯 + outpainting）、OpenAI Responses API 文字 AI、跨 provider 憑證處理、比例矩陣擴充（11 比例 × 4 tier）、Google Search 聯網生圖、網頁 iframe 嵌入、生成歷史面板、介面雙語補強與工作流程微調。

## 授權與權利說明

目前最合適的做法，是把本專案視為一個**混合權利專案**，而不是使用單一開放原始碼授權條款發布的軟體。

截至 2026-04-12，述文老師學習網首頁明確標示網站文章採用 CC BY-NC-SA 4.0 授權；但在這次查閱的 Prompt Case 公開 Patreon 頁面與 Nano Banana Infinite Canvas 作品集合頁中，尚未看到原始程式碼整體可再授權的公開條款。另外，Creative Commons 官方也不建議把 CC 授權直接套用在軟體程式碼上。

因此，本儲存庫目前採用混合權利聲明，而不是宣稱整體已經可以用 MIT、Apache-2.0、GPL 或其他單一軟體授權重新發布。詳情請參考 [LICENSE.md](LICENSE.md)。

### 免責聲明
本專案按現況提供，不附帶任何明示或暗示的保證。原始內容、二次改作內容與本次修改內容的相關權利，仍分別歸屬於各自的權利人。
