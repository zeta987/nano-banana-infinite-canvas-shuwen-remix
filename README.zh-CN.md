[English](README.md) | [正體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

# 无限画布 · GPT IMAGE 2 · Nano Banana 2 / Pro (进阶强化版)

以 **OpenAI GPT IMAGE 2** 作为旗舰生图引擎、搭配 **Nano Banana 2 / Nano Banana Pro (Gemini 3)** 的无限画布创作工具。整合 OpenAI Responses API / Chat Completions 的提示词优化、蒙版 inpainting、outpainting、网页嵌入与中英文双语界面。

![繁體中文首頁示意圖](https://github.com/user-attachments/assets/39f625f5-09ac-4848-b914-15d7c7fb48a8)

![繁體中文功能示意圖](https://github.com/user-attachments/assets/8362b8b9-bafb-4b86-bd9f-51691d811b92)

本项目建立在述文老师学习网的改编版之上，延续原作的操作概念，并加入这个 Remix 版本的功能扩充、界面调整与流程优化。

## 快速开始

**环境需求：** Node.js

1. 安装依赖包：
   ```bash
   npm install
   ```

2. 参考 `.env.example` 建立 `.env.local`，并填入 API 密钥：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 本次升级新增功能

- **GPT IMAGE 2 支持（旗舰）：** 完整串接 OpenAI `gpt-image-2` 的 `/v1/images/generations` 与 `/v1/images/edits`（支持蒙版 inpainting 与 outpainting）。完整暴露所有参数：`quality`、`output_format`、`background`、`moderation`（本项目默认为 `low`），并涵盖官方全部尺寸 preset（1K / 2K / 2K landscape / 4K landscape / 4K portrait）以及符合官方约束的自定义尺寸。
- **比例矩阵扩充：** 画布比例菜单涵盖 11 种（21:9 / 16:9 / 4:3 / 3:2 / 5:4 / 1:1 / 9:21 / 9:16 / 3:4 / 2:3 / 4:5 + auto），每种在各 tier 下都会映射为合法的 gpt-image-2 尺寸。
- **OpenAI 文字 AI（Responses + Chat Completions）：** 提示优化与分析可选择 `/v1/responses`（默认）或 `/v1/chat/completions`。内置模型菜单透过 `/v1/models` 自动获取，也可手动输入模型名称（适用自建 backend）。
- **跨 provider 凭证处理：** 生图与文字优化可选用不同 provider 而不需重复输入 key；provider 相同时共用凭证，不同时显示专用输入栏位。
- **Nano Banana 2 / Nano Banana Pro（Gemini 3）：** 原有功能完整保留，支持 Google Search grounding、图片搜索与多段 reasoning。
- **网页嵌入、生成历史面板、双语界面：** 延续并润饰前版。

## 核心功能

- **无限画布：** 支持平移、缩放、框选与多对象自由排版。
- **多样化元素：** 可加入便利贴、箭头、几何图形、手绘内容、图片与网页嵌入对象。
- **AI 影像生成：** 可直接使用选取的画布内容作为上下文生成新图片，支持以下引擎：
  - **GPT IMAGE 2**（旗舰） — OpenAI `/v1/images/generations`，涵盖 1K / 2K / 4K 各比例的原生尺寸。
  - **Nano Banana 2 / Nano Banana Pro**（Gemini 3）— 搭配 Google Search / 图片搜索 grounding。
  - *注：* Nano Banana 2 支持 `Minimal` 与 `High` 思考等级（默认为 `High`）；Nano Banana Pro 不支持调整思考等级。
- **文字 AI 工具：** 提示优化、分析等功能已整合在独立的“文字 AI”区块中。
- **AI 影像编辑：** 支持外扩生成与其他偏图像处理的工作流程。
- **编辑与整理工具：** 包含裁剪、编修、群组、对齐、小地图导航与剪贴板操作。
- **工作会话保存：** 支持将画布状态导出与导入为 JSON 格式。

## AI 模型设置说明

### 影像模型
- **GPT IMAGE 2（OpenAI，旗舰）：** 透过 `/v1/images/generations` 生图、`/v1/images/edits` 做蒙版 inpainting 与 outpainting。暴露 `quality`（auto/low/medium/high）、`output_format`（png/jpeg/webp）、`background`（auto/opaque）、`moderation`（auto/low，本项目默认 `low`）。
- **Nano Banana 2 / Pro（Google Gemini 3）：** `gemini-3.1-flash-image-preview` 与 `gemini-3-pro-image-preview`，支持 Google Search / 图片搜索 grounding。

### 文字 AI 模型
- **OpenAI 文字 AI：** 可切换 `/v1/responses`（默认）或 `/v1/chat/completions`。内置模型菜单透过 `/v1/models` 自动获取，也可手动输入模型名称。支持 `none`、`low`、`medium`、`high`、`xhigh` reasoning。
  - *重要：* 当选择 `none` 时，系统不会传递 reasoning-effort 参数，以避免部分不支持此参数的兼容模型发生错误。
- **Gemini 文字 AI：** 进行提示优化与图片分析等功能时，在 Gemini API 模式下默认采用 `High` 思考等级。
- **Gemini 模型下拉菜单：**
  - **Gemini 3 Flash：** 支持 `Minimal`、`Low`、`Medium`、`High`（默认为 `High`）。
  - **Gemini 3 Pro：** 支持 `Low`、`Medium`、`High`（默认为 `High`）。

### 环境设置
- 本项目通过 Vite 设置，将 `GEMINI_API_KEY` 映射为内置 Gemini 流程使用的运行时密钥。
- 若要改用自定义 Gemini 或 OpenAI 兼容服务，可直接于应用程序界面中设置对应参数。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 编译正式版本
npm run lint     # 运行 TypeScript 类型检查
npm run preview  # 预览编译后的版本
```

## Windows 注意事项

`migrated_prompt_history/` 目录是在 AI Studio Build 首次同步到 GitHub 时引入的。由于其中部分文件名称包含 `:` 字符，会导致 Windows 原生文件系统无法正常 checkout。如需完整克隆仓库，建议使用 WSL 或 Linux 环境。

## 传承与贡献声明

本项目的发展历程可分为三个阶段：

1. **原创作者：** Prompt_case
   *贡献：* 核心 UI 设计、无限画布基础架构、对象交互逻辑。
   *链接：* [Threads](https://www.threads.net/@prompt_case) | [Patreon](https://www.patreon.com/MattTrendsPromptEngineering)
2. **二次创作与优化：** 述文老师学习网
   *贡献：* Gemini 模型升级、提示词分析优化、繁体中文本地化，以及偏向教学情境的流程调整。
   *链接：* [教学文章与版本介绍](https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html)
3. **目前版本：** 本项目 Remix 版
   *贡献：* **串接 OpenAI GPT IMAGE 2**（生图 + 蒙版编辑 + outpainting）、OpenAI Responses API 文字 AI、跨 provider 凭证处理、比例矩阵扩充（11 比例 × 4 tier）、Google Search 联网生图、网页 iframe 嵌入、生成历史面板、界面双语补强与工作流程微调。

## 授权与权利说明

目前最合适的做法，是把本项目视为一个**混合权利项目**，而非使用单一开源授权条款发布的软件。

截至 2026-04-12，述文老师学习网首页明确标示网站文章采用 CC BY-NC-SA 4.0 授权；但在这次查阅的 Prompt Case 公开 Patreon 页面与 Nano Banana Infinite Canvas 作品集合页中，尚未看到原始源代码整体可再授权的公开条款。另外，Creative Commons 官方也不建议把 CC 授权直接套用在软件源代码上。

因此，本仓库目前采用混合权利声明，而非宣称整体已经可以用 MIT、Apache-2.0、GPL 或其他单一软件授权重新发布。详情请参考 [LICENSE.md](LICENSE.md)。

### 免责声明
本项目按现状提供，不附带任何明示或暗示的保证。原始内容、二次改作内容与本次修改内容的相关权利，仍分别归属于各自的权利人。
