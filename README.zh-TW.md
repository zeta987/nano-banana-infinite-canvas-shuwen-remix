[English](README.md) | [正體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

# Nano Banana 無限畫布 (進階強化版)

這是一個結合無限畫布、Gemini 3 影像生成、AI 提示詞最佳化、網頁嵌入與雙語介面調整的視覺化創作工具。

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

- **聯網生圖：** 生圖時可勾選 Google Search 與 Google Image Search，讓 Gemini 參考外部搜尋結果。
- **網頁嵌入：** 畫布支援加入網頁 iframe，並可選擇以可見區域或整頁模式提供生成背景。
- **生成歷史面板：** 集中保留近期生成的圖片，方便隨時重新加入畫布，保持工作區整潔。
- **雙語介面最佳化：** 補強並潤飾現有的中英文介面文字。
- **參考圖提示：** 新增 Banana 2 與 Banana Pro 的參考圖使用上限說明。

## 核心功能

- **無限畫布：** 支援平移、縮放、框選與多物件自由排版。
- **多樣化元素：** 可加入便利貼、箭頭、幾何圖形、手繪內容、圖片與網頁嵌入物件。
- **AI 影像生成：** 可直接使用選取的畫布內容作為上下文生成新圖片。
  - *註：* Nano Banana 2 支援 `Minimal` 與 `High` 思考層級（預設為 `High`）；Nano Banana Pro 不支援調整思考層級。
- **文字 AI 工具：** 提示最佳化、分析等功能已整合在獨立的「文字 AI」區塊中。
- **AI 影像編輯：** 支援外擴生成與其他偏影像處理的工作流程。
- **編輯與整理工具：** 包含裁切、編修、群組、對齊、小地圖導覽與剪貼簿操作。
- **工作階段儲存：** 支援將畫布狀態匯出與匯入為 JSON 格式。

## AI 模型設定說明

### 文字 AI 模型
- **Gemini 文字 AI：** 進行提示最佳化與圖片分析等功能時，在 Gemini API 模式下預設採用 `High` 思維。
- **Gemini 模型下拉選單：** 文字 AI 區塊有獨立的模型與思維設定：
  - **Gemini 3 Flash：** 支援 `Minimal`、`Low`、`Medium`、`High`（預設為 `High`）。
  - **Gemini 3 Pro：** 支援 `Low`、`Medium`、`High`（預設為 `High`）。
- **OpenAI 相容文字 AI：** 支援 `none`、`low`、`medium`、`high`、`xhigh`。
  - *重要：* 當選擇 `none` 時，系統會直接不傳遞 reasoning-effort 參數，以避免部分不支援此參數的相容模型發生錯誤。

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
   *貢獻：* 加入 Google Search 聯網生圖、網頁 iframe 嵌入、生成歷史面板、介面雙語補強與工作流程微調。

## 授權與權利說明

目前最合適的做法，是把本專案視為一個**混合權利專案**，而不是使用單一開放原始碼授權條款發布的軟體。

截至 2026-04-12，述文老師學習網首頁明確標示網站文章採用 CC BY-NC-SA 4.0 授權；但在這次查閱的 Prompt Case 公開 Patreon 頁面與 Nano Banana Infinite Canvas 作品集合頁中，尚未看到原始程式碼整體可再授權的公開條款。另外，Creative Commons 官方也不建議把 CC 授權直接套用在軟體程式碼上。

因此，本儲存庫目前採用混合權利聲明，而不是宣稱整體已經可以用 MIT、Apache-2.0、GPL 或其他單一軟體授權重新發布。詳情請參考 [LICENSE.md](LICENSE.md)。

### 免責聲明
本專案按現況提供，不附帶任何明示或暗示的保證。原始內容、二次改作內容與本次修改內容的相關權利，仍分別歸屬於各自的權利人。
