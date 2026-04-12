import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import {
  InfiniteCanvas,
  CanvasApi,
  ViewportData,
} from './components/InfiniteCanvas';
import { ContextMenu } from './components/ContextMenu';
import { DrawingModal } from './components/DrawingModal';
import { ImageEditModal } from './components/ImageEditModal';
import { CropModal } from './components/CropModal';
import { Minimap } from './components/Minimap';
import { GenerationPanel } from './components/GenerationPanel';
import type {
  CanvasElement,
  NoteElement,
  ImageElement,
  ArrowElement,
  DrawingElement,
  Point,
  ElementType,
  AnalysisResult,
  IFrameElement,
} from './types';
import { useHistoryState } from './useHistoryState';

export const COLORS = [
  { name: 'Gray', bg: 'bg-gray-700', text: 'text-gray-700' },
  { name: 'Red', bg: 'bg-red-500', text: 'text-red-500' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { name: 'Green', bg: 'bg-green-500', text: 'text-green-500' },
  { name: 'Blue', bg: 'bg-blue-600', text: 'text-blue-600' },
  { name: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600' },
  { name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500' },
];

const GRID_SIZE = 10;

const MEMO_1_ZH =
  '[ 🍌 Nano Banana 無限畫布 Infinite Canvas 🍌 ]\n\n👑 原創作者 (Original Creator): @Prompt_case\nThreads: @Prompt_case | Patreon: www.patreon.com/MattTrendsPromptEngineering\nCopyright: Prompt_case | 版權所有\n\n🛠️ 二次創作與優化 (Second Mod): 述文老師學習網\n教學文章：https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html\n\n✨ 三次修改版 (Current Version): 基於述文老師版本進階修改\n(加入 Gemini 3 聯網搜尋、UI 優化、網頁嵌入等新功能)';
const MEMO_1_EN =
  "[ 🍌 Nano Banana Infinite Canvas 🍌 ]\n\n👑 Original Creator: @Prompt_case\nThreads: @Prompt_case | Patreon: www.patreon.com/MattTrendsPromptEngineering\nCopyright: Prompt_case | All Rights Reserved\n\n🛠️ Second Mod & Optimization: Shuwen Learning Web\nTutorial: https://harmonica80.blogspot.com/2025/12/ainano-banana-infinite-canvas-gemini-3.html\n\n✨ Current Version: Advanced modification based on Shuwen's version\n(Added Gemini 3 Search Grounding, UI Optimization, Webpage Embed, etc.)";

const MEMO_2_ZH =
  '🕹️ CONTROL / 控制: \n\n● Pan / 平移:\n   Hold [SPACE] or [Middle Mouse Button]\n   按住 [空白鍵] 或 [滑鼠中鍵]\n\n● Zoom / 縮放: [SCROLL] / [滾輪]\n\n● Options / 選項: [Right-click] / [右鍵]';
const MEMO_2_EN =
  '🕹️ CONTROL: \n\n● Pan:\n   Hold [SPACE] or [Middle Mouse Button]\n\n● Zoom: [SCROLL]\n\n● Options: [Right-click]';

const MEMO_3_ZH =
  '⚡ Shortcut / 捷徑:\n\n● [Command+Z] for Undo / 復原\n\n● [Shift+Command+Z] for Redo / 重做\n\n● [Command+G] for Group / 群組';
const MEMO_3_EN =
  '⚡ Shortcut:\n\n● [Command+Z] for Undo\n\n● [Shift+Command+Z] for Redo\n\n● [Command+G] for Group';

const INITIAL_ELEMENTS: CanvasElement[] = [
  {
    id: '1',
    type: 'note',
    position: { x: 20, y: -150 },
    width: 550,
    height: 360,
    rotation: 0,
    zIndex: 1,
    content: MEMO_1_ZH,
    color: 'bg-blue-600',
    textAlign: 'center',
  },
  {
    id: '2',
    type: 'note',
    position: { x: 300, y: 220 },
    width: 280,
    height: 320,
    rotation: -10,
    zIndex: 2,
    content: MEMO_2_ZH,
    color: 'bg-green-500',
  },
  {
    id: '3',
    type: 'note',
    position: { x: -250, y: 220 },
    width: 280,
    height: 200,
    rotation: 5,
    zIndex: 0,
    content: MEMO_3_ZH,
    color: 'bg-yellow-500',
  },
];

const translations: Record<string, Record<string, string>> = {
  en: {
    infiniteCanvas: 'Infinite Canvas',
    selectObjectToTransform: 'Select objects to align them.',
    addNote: 'Add Note',
    addArrow: 'Add Arrow',
    addDrawing: 'Add Drawing',
    addImages: 'Add Image(s)',
    imageEdit: 'Image Edit',
    removeOrEditObject: 'Remove or Edit Object',
    expandImage: 'Expand Image',
    cropImage: 'Crop Image',
    saveCrop: 'Save Crop',
    color: 'Color',
    controls: 'Controls',
    settings: 'Settings',
    undo: 'Undo',
    redo: 'Redo',
    export: 'Export',
    import: 'Import',
    bringToFront: 'Front',
    sendToBack: 'Back',
    delete: 'Delete',
    resetView: 'Reset View',
    generatingImages: 'Generating...',
    thisMayTakeAMoment: 'Creating your visual masterpiece.',
    chooseAnImage: 'Choose an Image',
    addToCanvas: 'Add to Canvas',
    download: 'Download',
    close: 'Close',
    duplicate: 'Duplicate',
    changeColor: 'Change Color',
    downloadImage: 'Download Image',
    editDrawing: 'Edit Drawing',
    changeLanguage: '中文',
    alignPanelRight: 'Align Panel Right',
    alignPanelLeft: 'Align Panel Left',
    interactionMode: 'Touch Mode',
    panMode: 'Pan',
    selectMode: 'Select',
    analyzeDraft: 'Analyze with Gemini 3',
    analyzing: 'Thinking...',
    contentDescription: 'Gemini 3 Insights',
    styleSuggestions: 'Style Suggestions',
    copy: 'Copy',
    copied: 'Copied!',
    hide: 'Hide',
    show: 'Show',
    clear: 'Clear',
    translate: 'Translate',
    translating: 'Translating...',
    optimizePrompt: 'Gemini 3 Optimize',
    aiPromptOptimization: 'Prompt Opt. & Analysis Text AI',
    customOpenAIAPI: 'Custom OpenAI API',
    builtinAPIKey: 'Built-in API Key',
    customGeminiAPIKey: 'Custom Gemini API Key',
    openAIAPI: 'OpenAI API',
    geminiFollowAPI: 'Gemini (Follow Image API)',
    googleSearch: 'Google Search',
    googleImageSearch: 'Google Image Search',
    maxRefImages: 'Max 14 Reference Images:',
    flashRefLimit: 'Flash: 10 objects, 4 characters',
    proRefLimit: 'Pro: 6 objects, 5 characters',
    generationHistory: 'Generation History',
    generationHistoryDesc: 'Generated images will appear here.',
    generating: 'Generating...',
    generationHistoryEmpty:
      'Select elements on the canvas and click "Generate" to create an image.',
    closeGenerationPanel: 'Close Generation Panel',
    openGenerationPanel: 'Open Generation Panel',
    deleteImage: 'Delete Image',
    generationCount: 'Generation Count',
    addWebpage: 'Add Webpage',
    optimizing: 'Optimizing...',
    optimizedPrompt: 'Optimized Result',
    variations: 'Creative Variations',
    drawingPad: 'Drawing Pad',
    pencil: 'Pencil',
    eraser: 'Eraser',
    size: 'Size',
    saveDrawing: 'Save Drawing',
    cancel: 'Cancel',
    shapes: 'Shapes',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    star: 'Star',
    arrow: 'Arrow',
    group: 'Group',
    ungroup: 'Ungroup',
    copyToClipboard: 'Copy to Clipboard',
    pasteFromClipboard: 'Paste from Clipboard',
    layout: 'Layout & Align',
    snapToGrid: 'Snap to Grid',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    alignTop: 'Align Top',
    alignMiddle: 'Align Middle',
    alignBottom: 'Align Bottom',
    distributeHorizontally: 'Distribute Horizontally',
    distributeVertically: 'Distribute Vertically',
    tidyUp: 'Tidy Up (Auto Layout)',
    editImage: 'Edit Image',
    brush: 'Brush',
    brushSize: 'Brush Size',
    zoom: 'Zoom',
    clearMask: 'Clear Mask',
    saveToCanvas: 'Save to Canvas',
    describeYourEdit: 'Describe your edit...',
    editObject: 'Edit Object',
    removeObject: 'Remove Object',
    adjustments: 'Adjustments',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    temperature: 'Temperature',
    tint: 'Tint',
    highlight: 'Highlight',
    shadow: 'Shadow',
    sharpness: 'Sharpness',
    reset: 'Reset',
    resetAll: 'Reset All',
    previewOfYourEdit: 'Preview of your edit',
    discard: 'Discard',
    regenerate: 'Regenerate',
    applyAndContinue: 'Apply & Continue',
    generate: 'Generate',
    free: 'Free',
    stats_images: 'Images',
    stats_ai_ops: 'AI Ops',
    modelPriority: 'Model Selection',
    speedFlash: 'Banana 2',
    qualityPro: 'Banana Pro',
    usingFlash: 'Using gemini-3.1-flash-image-preview',
    usingPro: 'Using gemini-3-pro-image-preview',
    imageSize: 'Image Size',
    importTitle: 'Import Canvas',
    importDesc: 'Choose how you want to import this file.',
    importReplace: 'Replace Current',
    importMerge: 'Merge to Right',
    importReplaceDesc: 'Discard current content and load file.',
    importMergeDesc: 'Keep current content and add file to the right side.',
    aiErrorTitle: 'AI Operation Failed',
    aiErrorDesc:
      'The AI encountered an issue. Below is the technical details and translation:',
  },
  zh: {
    infiniteCanvas: '無限畫布',
    selectObjectToTransform: '選取多個物件進行對齊。',
    addNote: '新增便利貼',
    addArrow: '新增箭頭',
    addDrawing: '新增繪圖',
    addImages: '新增圖片',
    imageEdit: '圖片編輯',
    removeOrEditObject: '移除或編輯物件',
    expandImage: '擴展圖片',
    cropImage: '裁切圖片',
    saveCrop: '儲存裁切',
    color: '顏色',
    controls: '控制',
    settings: '設定',
    undo: '復原',
    redo: '重做',
    export: '匯出 JSON',
    import: '匯入 JSON',
    bringToFront: '↑ 移到最前',
    sendToBack: '↓ 移到最後',
    delete: '刪除物件',
    resetView: '重設視圖',
    generatingImages: '生成中...',
    thisMayTakeAMoment: '正在為您創作精彩影像...',
    chooseAnImage: '選擇一張圖片',
    addToCanvas: '新增至畫布',
    download: '下載',
    close: '關閉',
    duplicate: '複製',
    changeColor: '更改顏色',
    downloadImage: '下載圖片',
    editDrawing: '編輯繪圖',
    changeLanguage: 'English',
    alignPanelRight: '面板靠右',
    alignPanelLeft: '面板靠左',
    interactionMode: '觸控模式',
    panMode: '平移',
    selectMode: '選取',
    analyzeDraft: 'AI 深度分析',
    analyzing: '分析中...',
    contentDescription: 'AI 內容解析',
    styleSuggestions: '風格與構圖建議',
    copy: '複製',
    copied: '已複製！',
    hide: '隱藏',
    show: '顯示',
    clear: '清除',
    translate: '翻譯',
    translating: '翻譯中...',
    optimizePrompt: 'AI提示優化',
    aiPromptOptimization: '提示優化、分析等文字 AI',
    customOpenAIAPI: '自訂 OpenAI 相容 API',
    builtinAPIKey: '內建 API Key',
    customGeminiAPIKey: '自訂 Gemini API Key',
    openAIAPI: 'OpenAI 相容 API',
    geminiFollowAPI: 'Gemini (跟隨生圖 API 設定)',
    googleSearch: 'Google 搜尋',
    googleImageSearch: 'Google 圖片搜尋',
    maxRefImages: '最多 14 張參考圖：',
    flashRefLimit: 'Flash: 10 個物件，4 個角色',
    proRefLimit: 'Pro: 6 個物件，5 個角色',
    generationHistory: '生成歷史',
    generationHistoryDesc: '生成的圖片會顯示在這裡。',
    generating: '生成中...',
    generationHistoryEmpty: '在畫布上選擇元素並點擊「生成」來建立圖片。',
    closeGenerationPanel: '關閉生成面板',
    openGenerationPanel: '開啟生成面板',
    generationCount: '生成數量',
    addWebpage: '新增網頁',
    optimizing: '優化中...',
    optimizedPrompt: '優化版提示詞',
    variations: '創意變化建議',
    drawingPad: '繪圖板',
    pencil: '鉛筆',
    eraser: '橡皮擦',
    size: '大小',
    saveDrawing: '儲存繪圖',
    cancel: '取消',
    shapes: '圖形',
    line: '線條',
    rectangle: '矩形',
    circle: '圓形',
    triangle: '三角形',
    star: '星形',
    arrow: '箭頭',
    group: '建立群組',
    ungroup: '取消群組',
    copyToClipboard: '複製到剪貼簿',
    pasteFromClipboard: '從剪貼簿貼上',
    layout: '對齊與佈局',
    snapToGrid: '貼齊格點',
    alignLeft: '靠左對齊',
    alignCenter: '置中對齊',
    alignRight: '靠右對齊',
    alignTop: '靠上對齊',
    alignMiddle: '垂直置中',
    alignBottom: '靠下對齊',
    distributeHorizontally: '水平間距均分',
    distributeVertically: '垂直間距均分',
    tidyUp: '自動排版整理',
    editImage: '編輯圖片',
    brush: '畫筆',
    brushSize: '筆刷大小',
    zoom: '縮放',
    clearMask: '清除遮罩',
    saveToCanvas: '儲存至畫布',
    describeYourEdit: '描述您的編輯...',
    editObject: '編輯物件',
    removeObject: '移除物件',
    adjustments: '調整',
    brightness: '亮度',
    contrast: '對比度',
    saturation: '飽和度',
    temperature: '色溫',
    tint: '色調',
    highlight: '亮部',
    shadow: '陰影',
    sharpness: '銳利度',
    reset: '重設',
    resetAll: '全部重設',
    previewOfYourEdit: '編輯預覽',
    discard: '捨棄',
    regenerate: '重新生成',
    applyAndContinue: '應用並繼續',
    generate: '生成',
    free: '自由',
    stats_images: '已生成圖片',
    stats_ai_ops: 'AI 運算次數',
    modelPriority: '模型選擇',
    speedFlash: 'Banana 2',
    qualityPro: 'Banana Pro',
    usingFlash: '使用gemini-3.1-flash-image-preview',
    usingPro: '使用gemini-3-pro-image-preview',
    imageSize: '影像尺寸',
    importTitle: '匯入畫布',
    importDesc: '請選擇匯入此檔案的方式。',
    importReplace: '直接覆蓋內容',
    importMerge: '合併至右側',
    importReplaceDesc: '清除目前畫布，重新載入檔案。',
    importMergeDesc: '保留現有物件，將新物件放置在目前內容的右側。',
    aiErrorTitle: 'AI 操作失敗',
    aiErrorDesc: 'AI 在處理過程中遇到問題。以下是技術細節與翻譯：',
  },
};

interface ContextMenuData {
  x: number;
  y: number;
  worldPoint: Point;
  elementId: string | null;
}

export interface OutpaintingState {
  element: ImageElement;
  frame: {
    position: Point;
    width: number;
    height: number;
  };
}

export interface UsageStats {
  generatedImages: number;
  aiOperations: number;
}

interface PendingImportData {
  elements: CanvasElement[];
  analysisResults: Record<string, AnalysisResult>;
}

const App: React.FC = () => {
  const {
    state: elements,
    setState: setElements,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<CanvasElement[]>(INITIAL_ELEMENTS);

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [resetView, setResetView] = useState<() => void>(() => () => {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [isUrlPromptOpen, setIsUrlPromptOpen] = useState(false);
  const [urlPromptValue, setUrlPromptValue] = useState('https://');
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [editingDrawing, setEditingDrawing] = useState<DrawingElement | null>(
    null,
  );
  const [editingImage, setEditingImage] = useState<ImageElement | null>(null);
  const [croppingImage, setCroppingImage] = useState<ImageElement | null>(null);
  const [outpaintingState, setOutpaintingState] =
    useState<OutpaintingState | null>(null);
  const [imageStyle, setImageStyle] = useState<string>('Default');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('auto');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [panelAlignment, setPanelAlignment] = useState<'left' | 'right'>(
    'left',
  );
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>(
    'pan',
  );
  const [analysisResults, setAnalysisResults] = useState<
    Record<string, AnalysisResult>
  >({});
  const [analyzingElementId, setAnalyzingElementId] = useState<string | null>(
    null,
  );
  const [analysisVisibility, setAnalysisVisibility] = useState<
    Record<string, boolean>
  >({});
  const [translatingElementId, setTranslatingElementId] = useState<
    string | null
  >(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [viewport, setViewport] = useState<ViewportData>({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    zoom: 1,
  });

  const [usageStats, setUsageStats] = useState<UsageStats>({
    generatedImages: 0,
    aiOperations: 0,
  });
  const [generationModel, setGenerationModel] = useState<'flash' | 'pro'>(
    'flash',
  );
  const [imageSize, setImageSize] = useState<'512' | '1K' | '2K' | '4K'>('1K');
  const [apiProvider, setApiProvider] = useState<
    'builtin' | 'custom_gemini' | 'openai'
  >('builtin');
  const [customGeminiKey, setCustomGeminiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState<string>(
    'https://api.openai.com/v1',
  );
  const [generationCount, setGenerationCount] = useState<number | string>(2);
  const [generationGoogleSearch, setGenerationGoogleSearch] = useState(true);
  const [generationImageSearch, setGenerationImageSearch] = useState(true);
  const [generationThinkingLevel, setGenerationThinkingLevel] = useState<
    'HIGH' | 'LOW'
  >('HIGH');

  const [optimizationProvider, setOptimizationProvider] = useState<
    'gemini' | 'openai'
  >('gemini');
  const [optimizationModel, setOptimizationModel] = useState<'flash' | 'pro'>(
    'flash',
  );
  const [optimizationThinkingLevel, setOptimizationThinkingLevel] =
    useState<string>('high');
  const [optimizationOpenaiBaseUrl, setOptimizationOpenaiBaseUrl] =
    useState<string>('https://api.openai.com/v1');
  const [optimizationOpenaiApiKey, setOptimizationOpenaiApiKey] =
    useState<string>('');
  const [optimizationOpenaiModel, setOptimizationOpenaiModel] =
    useState<string>('gpt-4o');
  const [optimizationGrounding, setOptimizationGrounding] =
    useState<boolean>(true);

  const [pendingImport, setPendingImport] = useState<PendingImportData | null>(
    null,
  );
  const [aiErrorMessage, setAiErrorMessage] = useState<{
    en: string;
    zh: string;
  } | null>(null);
  const cancelGenerationRef = useRef(false);

  useEffect(() => {
    if (optimizationProvider === 'gemini') {
      if (
        optimizationModel === 'pro' &&
        ['minimal', 'none', 'xhigh'].includes(optimizationThinkingLevel)
      ) {
        setOptimizationThinkingLevel('high');
      } else if (
        optimizationModel === 'flash' &&
        ['none', 'xhigh'].includes(optimizationThinkingLevel)
      ) {
        setOptimizationThinkingLevel('high');
      }
    } else if (optimizationProvider === 'openai') {
      if (['minimal'].includes(optimizationThinkingLevel)) {
        setOptimizationThinkingLevel('high');
      }
    }
  }, [optimizationProvider, optimizationModel, optimizationThinkingLevel]);

  useEffect(() => {
    if (generationModel === 'pro' && imageSize === '512') {
      setImageSize('1K');
    }
  }, [generationModel, imageSize]);

  const handleCancelGeneration = useCallback(() => {
    cancelGenerationRef.current = true;
    setIsGenerating(false);
  }, []);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasApiRef = useRef<CanvasApi>(null);
  const lastImagePosition = useRef<Point | null>(null);
  const zIndexCounter = useRef(INITIAL_ELEMENTS.length);
  const dragCounter = useRef(0);
  const dragStartPositionsRef = useRef<Record<string, Point> | null>(null);
  const lastWorldMousePosition = useRef<Point | null>(null);

  const ai = useRef<GoogleGenAI | null>(null);

  const t = useCallback(
    (key: string) => {
      return translations[language][key] || key;
    },
    [language],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'zh' : 'en'));
  }, []);

  useEffect(() => {
    setElements((prev) =>
      prev.map((el) => {
        if (
          el.id === '1' &&
          el.type === 'note' &&
          (el.content === MEMO_1_ZH || el.content === MEMO_1_EN)
        ) {
          return { ...el, content: language === 'en' ? MEMO_1_EN : MEMO_1_ZH };
        }
        if (
          el.id === '2' &&
          el.type === 'note' &&
          (el.content === MEMO_2_ZH || el.content === MEMO_2_EN)
        ) {
          return { ...el, content: language === 'en' ? MEMO_2_EN : MEMO_2_ZH };
        }
        if (
          el.id === '3' &&
          el.type === 'note' &&
          (el.content === MEMO_3_ZH || el.content === MEMO_3_EN)
        ) {
          return { ...el, content: language === 'en' ? MEMO_3_EN : MEMO_3_ZH };
        }
        return el;
      }),
    );
  }, [language, setElements]);

  const getAi = useCallback(() => {
    if (apiProvider === 'custom_gemini') {
      if (!customGeminiKey) return null;
      return new GoogleGenAI({ apiKey: customGeminiKey });
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, [apiProvider, customGeminiKey]);

  const handleAiError = useCallback(
    async (error: any) => {
      console.error('AI Operation Error:', error);

      let msg = '';
      let fullErrorString = '';

      if (error instanceof Error) {
        msg = error.message;
        fullErrorString = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        );
      } else if (typeof error === 'string') {
        msg = error;
        fullErrorString = error;
      } else {
        try {
          msg = JSON.stringify(error);
          fullErrorString = msg;
        } catch (e) {
          msg = String(error);
          fullErrorString = msg;
        }
      }

      const isAuthError =
        fullErrorString.includes('leaked') ||
        fullErrorString.includes('403') ||
        fullErrorString.includes('401') ||
        fullErrorString.includes('PERMISSION_DENIED') ||
        fullErrorString.includes('API_KEY_INVALID') ||
        fullErrorString.includes('无效的令牌') ||
        fullErrorString.includes('invalid_api_key') ||
        fullErrorString.includes('The caller does not have permission');

      if (isAuthError) {
        if (
          apiProvider === 'builtin' &&
          (window as any).aistudio?.openSelectKey
        ) {
          await (window as any).aistudio.openSelectKey();
        } else {
          setAiErrorMessage({
            en: `API Key Error: Invalid API Key or Permission Denied.`,
            zh: `API Key 錯誤: 無效的 API Key 或沒有權限。`,
          });
        }
        return;
      }

      // Handle other errors by explaining them with AI
      let zhMsg = msg;
      try {
        const ai = getAi();
        if (ai) {
          const requestBody = {
            model: 'gemini-3-flash-preview',
            contents: `Reply in 台灣正體中文.You are a senior software engineer and system architect. Break down the following code step by step, explain how each part works and why it was designed that way, note any potential issues, and summarize the overall purpose:\n'''\n${msg}\n'''`,
          };
          console.log('[API Request] Gemini Error Explanation:', requestBody);
          const explanationResponse =
            await ai.models.generateContent(requestBody);
          console.log(
            '[API Response] Gemini Error Explanation:',
            explanationResponse.text,
          );
          zhMsg = explanationResponse.text?.trim() || msg;
        }
      } catch (explainError) {
        console.error('Explanation error:', explainError);
      }

      setAiErrorMessage({ en: msg, zh: zhMsg });
    },
    [getAi, apiProvider],
  );

  const getCenterOfViewport = useCallback((): Point => {
    if (canvasApiRef.current) {
      const screenCenter: Point = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      return canvasApiRef.current.screenToWorld(screenCenter);
    }
    return { x: 0, y: 0 };
  }, []);

  const getTargetPosition = useCallback((): Point => {
    const selected = elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    if (selected.length > 0) {
      const getRotatedCorners = (el: CanvasElement): Point[] => {
        const { x, y } = el.position;
        const { width, height, rotation } = el;
        const rad = rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const halfW = width / 2;
        const halfH = height / 2;
        const corners = [
          { x: -halfW, y: -halfH },
          { x: halfW, y: -halfH },
          { x: halfW, y: halfH },
          { x: -halfW, y: halfH },
        ];
        return corners.map((corner) => ({
          x: x + corner.x * cos - corner.y * sin,
          y: y + corner.x * sin + corner.y * cos,
        }));
      };

      const allCorners = selected.flatMap(getRotatedCorners);
      const maxX = Math.max(...allCorners.map((c) => c.x));
      const minY = Math.min(...allCorners.map((c) => c.y));
      const maxY = Math.max(...allCorners.map((c) => c.y));

      return { x: maxX + 250, y: (minY + maxY) / 2 };
    }

    if (lastWorldMousePosition.current) {
      return {
        x: lastWorldMousePosition.current.x + 20,
        y: lastWorldMousePosition.current.y + 20,
      };
    }

    return getCenterOfViewport();
  }, [elements, selectedElementIds, getCenterOfViewport]);

  const handleCanvasMouseMove = (worldPoint: Point) => {
    lastWorldMousePosition.current = worldPoint;
  };

  const handleViewportChange = useCallback((newViewport: ViewportData) => {
    setViewport(newViewport);
  }, []);

  const handleZoomIn = () => canvasApiRef.current?.zoomIn();
  const handleZoomOut = () => canvasApiRef.current?.zoomOut();
  const handlePanTo = (worldPoint: Point) =>
    canvasApiRef.current?.panTo(worldPoint);

  const addElement = useCallback(
    (
      newElement:
        | Omit<NoteElement, 'id' | 'zIndex'>
        | Omit<ImageElement, 'id' | 'zIndex'>
        | Omit<ArrowElement, 'id' | 'zIndex'>
        | Omit<DrawingElement, 'id' | 'zIndex'>
        | Omit<IFrameElement, 'id' | 'zIndex'>,
    ) => {
      const elementWithId: CanvasElement = {
        ...newElement,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        zIndex: zIndexCounter.current++,
      } as CanvasElement;
      setElements((prev) => [...prev, elementWithId]);
    },
    [setElements],
  );

  const addNote = useCallback(
    (position?: Point) => {
      addElement({
        type: 'note',
        position: position || getTargetPosition(),
        width: 150,
        height: 100,
        rotation: 0,
        content: 'New Note',
        color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
      });
    },
    [addElement, getTargetPosition],
  );

  const addIFrame = useCallback(
    (url: string, position?: Point) => {
      try {
        new URL(url);
      } catch (_) {
        setAiErrorMessage({
          en: 'Invalid URL provided.',
          zh: '提供的網址無效。',
        });
        return;
      }

      addElement({
        type: 'iframe',
        position: position || getTargetPosition(),
        width: 500,
        height: 400,
        rotation: 0,
        url,
        isActivated: false,
        sourceMode: 'viewport',
      });
    },
    [addElement, getTargetPosition],
  );

  const addGeneratedImageToCanvas = useCallback(
    (imageUrl: string) => {
      if (!imageUrl) return;

      const src = imageUrl;
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 400;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        addElement({
          type: 'image',
          position: getCenterOfViewport(),
          src,
          width,
          height,
          rotation: 0,
        });
      };

      img.src = src;
    },
    [addElement, getCenterOfViewport],
  );

  const handleDeleteGeneratedImage = (indexToDelete: number) => {
    setGenerationHistory((prev) =>
      prev.filter((_, index) => index !== indexToDelete),
    );
  };

  const addDrawing = useCallback(
    (position?: Point) => {
      addElement({
        type: 'drawing',
        position: position || getTargetPosition(),
        width: 400,
        height: 300,
        rotation: 0,
        src: '',
      });
    },
    [addElement, getTargetPosition],
  );

  const handleEditDrawing = useCallback(
    (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (element && element.type === 'drawing') {
        setEditingDrawing(element);
      }
    },
    [elements],
  );

  const handleSaveDrawing = (elementId: string, dataUrl: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId ? ({ ...el, src: dataUrl } as CanvasElement) : el,
      ),
    );
    setEditingDrawing(null);
  };

  const handleStartImageEdit = useCallback(
    (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (element && element.type === 'image') {
        setEditingImage(element);
      }
    },
    [elements],
  );

  const handleSaveImageEdit = (elementId: string, newSrc: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId && el.type === 'image'
          ? ({ ...el, src: newSrc } as CanvasElement)
          : el,
      ),
    );
    setEditingImage(null);
  };

  const handleStartCrop = useCallback(
    (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (element && element.type === 'image') {
        setCroppingImage(element);
      }
    },
    [elements],
  );

  const handleSaveCrop = (
    elementId: string,
    newSrc: string,
    newWidth: number,
    newHeight: number,
  ) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId && el.type === 'image'
          ? ({
              ...el,
              src: newSrc,
              width: newWidth,
              height: newHeight,
            } as CanvasElement)
          : el,
      ),
    );
    setCroppingImage(null);
  };

  const handleStartOutpainting = useCallback(
    (elementId: string) => {
      const element = elements.find(
        (el) => el.id === elementId && el.type === 'image',
      ) as ImageElement | undefined;
      if (element) {
        setOutpaintingState({
          element,
          frame: {
            position: { ...element.position },
            width: element.width,
            height: element.height,
          },
        });
        setSelectedElementIds([]);
        setContextMenu(null);
      }
    },
    [elements],
  );

  const handleUpdateOutpaintingFrame = useCallback(
    (newFrame: { position: Point; width: number; height: number }) => {
      setOutpaintingState((prev) =>
        prev ? { ...prev, frame: { ...prev.frame, ...newFrame } } : null,
      );
    },
    [],
  );

  const handleCancelOutpainting = () => {
    setOutpaintingState(null);
  };

  const handleOutpaintingGenerate = useCallback(
    async (prompt: string) => {
      if (!outpaintingState) return;

      const genAI = getAi();
      if (!genAI) return;

      setIsGenerating(true);
      cancelGenerationRef.current = false;
      const { element, frame } = outpaintingState;

      try {
        const taskCanvas = document.createElement('canvas');
        taskCanvas.width = Math.ceil(frame.width);
        taskCanvas.height = Math.ceil(frame.height);
        const ctx = taskCanvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        const originalImage = new Image();
        originalImage.src = element.src;
        await new Promise<void>((resolve, reject) => {
          originalImage.onload = () => resolve();
          originalImage.onerror = reject;
        });

        const drawX =
          frame.width / 2 +
          (element.position.x - frame.position.x) -
          element.width / 2;
        const drawY =
          frame.height / 2 +
          (element.position.y - frame.position.y) -
          element.height / 2;
        ctx.drawImage(
          originalImage,
          drawX,
          drawY,
          element.width,
          element.height,
        );

        const taskImageB64 = taskCanvas.toDataURL('image/png');
        const [header, data] = taskImageB64.split(',');
        const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
        const imagePart = { inlineData: { data, mimeType } };
        const finalPrompt = `This is an outpainting task. The existing image is part of a larger scene. Fill the surrounding transparent areas to naturally and seamlessly extend the image. User guidance: "${prompt || 'Continue the scene naturally.'}"`;
        const textPart = { text: finalPrompt };

        const requestBody = {
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, textPart] },
          config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        };
        console.log('[API Request] Gemini Outpainting:', {
          ...requestBody,
          contents: {
            parts: requestBody.contents.parts.map((p) =>
              'inlineData' in p
                ? {
                    inlineData: {
                      mimeType: p.inlineData.mimeType,
                      data: '[BASE64_IMAGE_DATA]',
                    },
                  }
                : p,
            ),
          },
        });

        const response = await genAI.models.generateContent(requestBody);

        console.log('[API Response] Gemini Outpainting:', {
          ...response,
          candidates: response.candidates?.map((c) => ({
            ...c,
            content: {
              ...c.content,
              parts: c.content.parts.map((p) =>
                p.inlineData
                  ? {
                      inlineData: {
                        mimeType: p.inlineData.mimeType,
                        data: '[BASE64_IMAGE_DATA]',
                      },
                    }
                  : p,
              ),
            },
          })),
        });

        if (cancelGenerationRef.current) return;

        const part = response.candidates[0].content.parts.find(
          (p) => p.inlineData,
        );
        if (!part?.inlineData) throw new Error('AI did not return an image.');
        const newImageSrc = `data:image/png;base64,${part.inlineData.data}`;

        const updatedElement: ImageElement = {
          ...element,
          src: newImageSrc,
          position: { ...frame.position },
          width: frame.width,
          height: frame.height,
        };
        setElements((prev) =>
          prev.map((el) => (el.id === element.id ? updatedElement : el)),
        );
        setUsageStats((prev) => ({
          ...prev,
          generatedImages: prev.generatedImages + 1,
        }));
      } catch (error) {
        handleAiError(error);
      } finally {
        setIsGenerating(false);
        setOutpaintingState(null);
      }
    },
    [outpaintingState, getAi, setElements],
  );

  const handleAutoPromptGenerate = useCallback(
    async (state: OutpaintingState): Promise<string> => {
      const genAI = getAi();
      if (!genAI) {
        throw new Error('AI not initialized.');
      }

      const { element, frame } = state;

      const taskCanvas = document.createElement('canvas');
      taskCanvas.width = Math.ceil(frame.width);
      taskCanvas.height = Math.ceil(frame.height);
      const ctx = taskCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      const originalImage = new Image();
      originalImage.src = element.src;
      await new Promise<void>((resolve, reject) => {
        originalImage.onload = () => resolve();
        originalImage.onerror = reject;
      });

      const drawX =
        frame.width / 2 +
        (element.position.x - frame.position.x) -
        element.width / 2;
      const drawY =
        frame.height / 2 +
        (element.position.y - frame.position.y) -
        element.height / 2;
      ctx.drawImage(originalImage, drawX, drawY, element.width, element.height);

      const taskImageB64 = taskCanvas.toDataURL('image/png');
      const [header, data] = taskImageB64.split(',');
      const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
      const imagePart = { inlineData: { data, mimeType } };

      const analysisPrompt =
        "Analyze the provided image, which shows a smaller picture placed on a larger transparent canvas for an expansion task. Based on the picture's content and its placement, infer the user's intent. Generate a concise, direct prompt for another AI to fill the transparent area. For example, if the expansion is below a person, suggest 'add their legs and feet.' If it's to the sides of a landscape, suggest 'expand the beautiful mountain scenery.' The prompt should be short, clear, and contain only the instruction.";
      const textPart = { text: analysisPrompt };

      try {
        const requestBody = {
          model: 'gemini-3-flash-preview',
          contents: { parts: [imagePart, textPart] },
        };
        console.log('[API Request] Gemini Outpainting Prompt Gen:', {
          ...requestBody,
          contents: {
            parts: requestBody.contents.parts.map((p) =>
              'inlineData' in p
                ? {
                    inlineData: {
                      mimeType: p.inlineData.mimeType,
                      data: '[BASE64_IMAGE_DATA]',
                    },
                  }
                : p,
            ),
          },
        });

        const response = await genAI.models.generateContent(requestBody);
        console.log(
          '[API Response] Gemini Outpainting Prompt Gen:',
          response.text,
        );

        const generatedPrompt = response.text.trim();
        if (!generatedPrompt) {
          throw new Error('AI failed to generate a descriptive prompt.');
        }
        setUsageStats((prev) => ({
          ...prev,
          aiOperations: prev.aiOperations + 1,
        }));
        return generatedPrompt;
      } catch (error) {
        handleAiError(error);
        return '';
      }
    },
    [getAi, handleAiError],
  );

  const addArrow = useCallback(
    (position?: Point) => {
      const start = position || getTargetPosition();
      const end = { x: start.x + 150, y: start.y };

      const dx = end.x - start.x;
      const dy = end.y - start.y;

      const width = Math.sqrt(dx * dx + dy * dy);
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      const centerPosition = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };

      addElement({
        type: 'arrow',
        start,
        end,
        position: centerPosition,
        width,
        height: 30,
        rotation,
        color: 'text-red-500',
      });
    },
    [addElement, getTargetPosition],
  );

  const triggerImageUpload = (position?: Point) => {
    lastImagePosition.current = position || null;
    imageInputRef.current?.click();
  };

  const addImagesToCanvas = useCallback(
    (files: File[], basePosition: Point) => {
      const imagePromises = files.map((file, index) => {
        return new Promise<Omit<ImageElement, 'id' | 'zIndex'> | null>(
          (resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (!src) return resolve(null);

              const img = new Image();
              img.onload = () => {
                const MAX_DIMENSION = 300;
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                  if (width > height) {
                    height = (height / width) * MAX_DIMENSION;
                    width = MAX_DIMENSION;
                  } else {
                    width = (width / height) * MAX_DIMENSION;
                    height = MAX_DIMENSION;
                  }
                }
                const position = {
                  x: basePosition.x + index * 20,
                  y: basePosition.y + index * 20,
                };
                resolve({
                  type: 'image',
                  position,
                  src,
                  width,
                  height,
                  rotation: 0,
                });
              };
              img.onerror = () => resolve(null);
              img.src = src;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          },
        );
      });

      Promise.all(imagePromises).then((results) => {
        const newElements = results.filter(
          (el): el is Omit<ImageElement, 'id' | 'zIndex'> => el !== null,
        );
        if (newElements.length > 0) {
          setElements((prev) => [
            ...prev,
            ...newElements.map(
              (el) =>
                ({
                  ...el,
                  id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  zIndex: zIndexCounter.current++,
                }) as CanvasElement,
            ),
          ]);
        }
      });
    },
    [setElements],
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const position = lastImagePosition.current || getTargetPosition();
      addImagesToCanvas(Array.from(files), position);

      lastImagePosition.current = null;

      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    },
    [addImagesToCanvas, getTargetPosition],
  );

  const handleGenerate = useCallback(
    async (selectedElements: CanvasElement[]) => {
      if (apiProvider === 'builtin' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
      }

      if (apiProvider !== 'openai') {
        const currentAi = getAi();
        if (!currentAi) {
          if (apiProvider === 'builtin' && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
          } else {
            setAiErrorMessage({
              en: 'API Key is missing. Please check your model settings.',
              zh: '找不到 API Key，請在模型設定中輸入。',
            });
          }
          return;
        }
      } else {
        if (!openaiApiKey) {
          setAiErrorMessage({
            en: 'OpenAI API Key is missing. Please check your model settings.',
            zh: '找不到 OpenAI API Key，請在模型設定中輸入。',
          });
          return;
        }
      }

      const modelName =
        generationModel === 'pro'
          ? 'gemini-3-pro-image-preview'
          : 'gemini-3.1-flash-image-preview';

      const imageElements = selectedElements.filter(
        (el) => el.type === 'image' || el.type === 'drawing',
      ) as (ImageElement | DrawingElement)[];
      const noteElements = selectedElements.filter(
        (el) => el.type === 'note',
      ) as NoteElement[];

      if (imageElements.length === 0 && noteElements.length === 0) {
        setAiErrorMessage({
          en: 'Please select at least one image, drawing, or note to provide context for generation.',
          zh: '請至少選擇一張圖片、繪圖或便利貼作為生成上下文。',
        });
        return;
      }

      setIsGenerating(true);
      setGeneratedImages(null);
      cancelGenerationRef.current = false;

      try {
        let instructions = noteElements.map((note) => note.content).join(' \n');

        const activeIframeElements = elements.filter(
          (el) => el.type === 'iframe' && (el as IFrameElement).isActivated,
        ) as IFrameElement[];

        if (activeIframeElements.length > 0) {
          const iframeContext = activeIframeElements
            .map(
              (iframe) =>
                `分析此網址的網頁內容：${iframe.url}。使用者對${iframe.sourceMode === 'viewport' ? '目前可見內容' : '整個頁面內容'}感興趣。`,
            )
            .join('\n');

          instructions += `\n\n[網頁背景]\n${iframeContext}\n（注意：您無法直接存取該網頁，但請使用網址和使用者的意圖來引導生成。）`;
        }

        let finalInstructions = instructions;
        if (imageStyle && imageStyle !== 'Default') {
          finalInstructions = instructions
            ? `${instructions}, ${imageStyle} Style`
            : `${imageStyle} Style`;
        }

        const count = Number(generationCount) || 1;

        if (apiProvider === 'openai') {
          const openaiAspectRatioMap: Record<string, string> = {
            '1:1': '1024x1024',
            '3:4': '1024x1024',
            '4:3': '1024x1024',
            '9:16': '1024x1792',
            '16:9': '1792x1024',
            auto: '1024x1024',
          };
          const size = openaiAspectRatioMap[imageAspectRatio] || '1024x1024';

          const requestBody = {
            model: 'gpt-image-1.5',
            prompt: finalInstructions || 'Generate an image',
            n: count,
            size: size,
          };
          console.log('[API Request] OpenAI Image Generation:', requestBody);

          const response = await fetch(
            `${openaiBaseUrl.replace(/\/$/, '')}/images/generations`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiApiKey}`,
              },
              body: JSON.stringify(requestBody),
            },
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            console.error(
              '[API Error] OpenAI Image Generation:',
              errData || response.statusText,
            );
            throw new Error(
              `OpenAI API Error: ${response.status} ${errData ? JSON.stringify(errData) : response.statusText}`,
            );
          }

          const data = await response.json();
          console.log('[API Response] OpenAI Image Generation:', data);
          if (cancelGenerationRef.current) return;

          const validImages = await Promise.all(
            data.data.map(async (item: any) => {
              if (item.b64_json)
                return `data:image/png;base64,${item.b64_json}`;
              if (item.url) {
                try {
                  const imgRes = await fetch(item.url);
                  const blob = await imgRes.blob();
                  return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                } catch (e) {
                  console.error('Failed to fetch OpenAI image URL:', e);
                  return item.url;
                }
              }
              return null;
            }),
          );
          const filteredImages = validImages.filter(
            (img): img is string => img !== null,
          );
          setGeneratedImages(filteredImages);
          if (filteredImages.length > 0) {
            setGenerationHistory((prev) => [...filteredImages, ...prev]);
          }
          setUsageStats((prev) => ({
            ...prev,
            generatedImages: prev.generatedImages + filteredImages.length,
          }));
        } else {
          let parts: (
            | { inlineData: { data: string; mimeType: string } }
            | { text: string }
          )[];

          if (imageElements.length > 0) {
            const imageParts = imageElements
              .filter((el) => el.src)
              .map((el) => {
                const [header, data] = el.src.split(',');
                const mimeType =
                  header.match(/data:(.*);base64/)?.[1] || 'image/png';
                return { inlineData: { data, mimeType } };
              });

            const promptForEditing =
              finalInstructions ||
              'Creatively reimagine and enhance the image(s).';
            const textPart = { text: promptForEditing };
            parts = [...imageParts, textPart];
          } else {
            const promptText = `Generate a completely new image based on this description: "${finalInstructions}"`;
            const textPart = { text: promptText };
            parts = [textPart];
          }

          const config: any = {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
          };

          if (generationModel === 'flash') {
            config.thinkingConfig = {
              thinkingLevel: generationThinkingLevel,
            };
          }

          if (
            generationGoogleSearch ||
            (generationImageSearch && generationModel === 'flash')
          ) {
            const searchTypes: any = {};
            if (generationGoogleSearch) {
              searchTypes.webSearch = {};
            }
            if (generationImageSearch && generationModel === 'flash') {
              searchTypes.imageSearch = {};
            }

            config.tools = [
              {
                googleSearch:
                  Object.keys(searchTypes).length > 0 ? { searchTypes } : {},
              },
            ];
          }

          if (imageAspectRatio !== 'auto' || generationModel === 'pro') {
            config.imageConfig = {};
            if (imageAspectRatio !== 'auto') {
              config.imageConfig.aspectRatio = imageAspectRatio;
            }
            if (generationModel === 'pro') {
              config.imageConfig.imageSize = imageSize;
            }
          }

          const generateSingleImage = async () => {
            const currentAi = getAi();
            if (!currentAi) return null;

            const requestBody = {
              model: modelName,
              contents: { parts },
              config: config,
            };
            console.log('[API Request] Gemini Image Generation:', {
              ...requestBody,
              contents: {
                parts: parts.map((p) =>
                  'inlineData' in p
                    ? {
                        inlineData: {
                          mimeType: p.inlineData.mimeType,
                          data: '[BASE64_IMAGE_DATA]',
                        },
                      }
                    : p,
                ),
              },
            });

            const response =
              await currentAi.models.generateContent(requestBody);

            console.log('[API Response] Gemini Image Generation:', {
              ...response,
              candidates: response.candidates?.map((c) => ({
                ...c,
                content: {
                  ...c.content,
                  parts: c.content.parts.map((p) =>
                    p.inlineData
                      ? {
                          inlineData: {
                            mimeType: p.inlineData.mimeType,
                            data: '[BASE64_IMAGE_DATA]',
                          },
                        }
                      : p,
                  ),
                },
              })),
            });

            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
              }
            }
            return null;
          };

          const promises = Array.from({ length: count }).map(() =>
            generateSingleImage(),
          );
          const images = await Promise.all(promises);

          if (cancelGenerationRef.current) return;

          const validImages = images.filter(
            (img): img is string => img !== null,
          );
          setGeneratedImages(validImages);
          if (validImages.length > 0) {
            setGenerationHistory((prev) => [...validImages, ...prev]);
          }
          setUsageStats((prev) => ({
            ...prev,
            generatedImages: prev.generatedImages + validImages.length,
          }));
        }
      } catch (error) {
        handleAiError(error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      getAi,
      imageStyle,
      imageAspectRatio,
      generationModel,
      imageSize,
      handleAiError,
      apiProvider,
      openaiApiKey,
      openaiBaseUrl,
      generationCount,
    ],
  );

  const handleSelectElement = useCallback(
    (id: string | null, shiftKey: boolean) => {
      if (contextMenu) setContextMenu(null);

      if (id === null) {
        if (!shiftKey) setSelectedElementIds([]);
        return;
      }

      const clickedElement = elements.find((el) => el.id === id);

      if (clickedElement?.groupId && !shiftKey) {
        const groupMemberIds = elements
          .filter((el) => el.groupId === clickedElement.groupId)
          .map((el) => el.id);
        setSelectedElementIds(groupMemberIds);
        return;
      }

      setSelectedElementIds((prevIds) => {
        if (shiftKey) {
          return prevIds.includes(id)
            ? prevIds.filter((prevId) => prevId !== id)
            : [...prevIds, id];
        } else {
          return prevIds.includes(id) ? prevIds : [id];
        }
      });
    },
    [contextMenu, elements],
  );

  const handleMarqueeSelect = useCallback(
    (ids: string[], shiftKey: boolean) => {
      setSelectedElementIds((prevIds) => {
        if (shiftKey) {
          const prevSet = new Set(prevIds);
          const newIds = ids.filter((id) => !prevSet.has(id));
          return [...prevIds, ...newIds];
        } else {
          return ids;
        }
      });
    },
    [],
  );

  const updateElements = useCallback(
    (updatedElement: CanvasElement, dragDelta?: Point) => {
      setElements(
        (prevElements) => {
          const snap = (v: number) =>
            snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

          if (
            dragDelta &&
            selectedElementIds.length > 1 &&
            selectedElementIds.includes(updatedElement.id)
          ) {
            // Capture start positions on first drag frame (dragDelta is now cumulative)
            if (!dragStartPositionsRef.current) {
              const startPos: Record<string, Point> = {};
              const selectedSet = new Set(selectedElementIds);
              prevElements.forEach((el) => {
                if (selectedSet.has(el.id)) {
                  startPos[el.id] = { x: el.position.x, y: el.position.y };
                }
              });
              dragStartPositionsRef.current = startPos;
            }

            const startPositions = dragStartPositionsRef.current;
            const selectedSet = new Set(selectedElementIds);

            return prevElements.map((el) => {
              if (!selectedSet.has(el.id)) return el;

              const startPos = startPositions[el.id];
              if (!startPos) return el;

              const newX = snap(startPos.x + dragDelta.x);
              const newY = snap(startPos.y + dragDelta.y);

              if (el.id === updatedElement.id) {
                // Dragged element: preserve updated properties (e.g., arrow start/end)
                return {
                  ...updatedElement,
                  position: { x: newX, y: newY },
                } as CanvasElement;
              }

              // Companion elements: absolute position from frozen start + cumulative delta
              return { ...el, position: { x: newX, y: newY } } as CanvasElement;
            });
          } else {
            return prevElements.map((el) => {
              if (el.id === updatedElement.id) {
                const snappedX = snap(updatedElement.position.x);
                const snappedY = snap(updatedElement.position.y);
                return {
                  ...updatedElement,
                  position: { x: snappedX, y: snappedY },
                } as CanvasElement;
              }
              return el;
            });
          }
        },
        { addToHistory: false },
      );
    },
    [selectedElementIds, setElements, snapToGrid],
  );

  const updateMultipleElements = useCallback(
    (
      updates: (Partial<CanvasElement> & { id: string })[],
      addToHistory: boolean = false,
    ) => {
      const updatesMap = new Map(updates.map((u) => [u.id, u]));
      setElements(
        (prev) =>
          prev.map((el) => {
            if (updatesMap.has(el.id)) {
              return { ...el, ...updatesMap.get(el.id) } as CanvasElement;
            }
            return el;
          }),
        { addToHistory },
      );
    },
    [setElements],
  );

  const handleInteractionEnd = useCallback(() => {
    dragStartPositionsRef.current = null;
    setElements((currentElements) => currentElements, { addToHistory: true });
  }, [setElements]);

  const deleteElement = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selectedSet = new Set(selectedElementIds);
    setElements((prev) => prev.filter((el) => !selectedSet.has(el.id)));
    setSelectedElementIds([]);
  }, [selectedElementIds, setElements]);

  const getSelectedGroupInfo = useMemo(() => {
    const selected = elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    if (selected.length === 0)
      return { canGroup: false, canUngroup: false, isGroup: false };

    const groupIds = new Set(selected.map((el) => el.groupId).filter(Boolean));
    const hasUngrouped = selected.some((el) => !el.groupId);

    const canGroup =
      selected.length > 1 && !(groupIds.size === 1 && !hasUngrouped);
    const canUngroup =
      selected.length > 0 && groupIds.size === 1 && !hasUngrouped;

    return { canGroup, canUngroup, isGroup: canUngroup };
  }, [elements, selectedElementIds]);

  const groupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canGroup) return;
    const newGroupId = `group-${Date.now()}`;
    const selectedSet = new Set(selectedElementIds);
    setElements((prev) =>
      prev.map((el) =>
        selectedSet.has(el.id)
          ? ({ ...el, groupId: newGroupId } as CanvasElement)
          : el,
      ),
    );
  }, [selectedElementIds, setElements, getSelectedGroupInfo.canGroup]);

  const ungroupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canUngroup) return;

    const selected = elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    const groupIdToUngroup = selected[0]?.groupId;
    if (!groupIdToUngroup) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.groupId === groupIdToUngroup) {
          const { groupId, ...rest } = el;
          return rest as CanvasElement;
        }
        return el;
      }),
    );
  }, [
    elements,
    selectedElementIds,
    setElements,
    getSelectedGroupInfo.canUngroup,
  ]);

  // Alignment functionality
  const alignSelected = useCallback(
    (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const selected = elements.filter((el) =>
        selectedElementIds.includes(el.id),
      );
      if (selected.length <= 1) return;

      let targetValue = 0;
      if (type === 'left') {
        targetValue = selected[0].position.x - selected[0].width / 2;
        for (let i = 1; i < selected.length; i++) {
          const val = selected[i].position.x - selected[i].width / 2;
          if (val < targetValue) targetValue = val;
        }
      }
      if (type === 'center')
        targetValue =
          selected.reduce((acc, el) => acc + el.position.x, 0) /
          selected.length;
      if (type === 'right') {
        targetValue = selected[0].position.x + selected[0].width / 2;
        for (let i = 1; i < selected.length; i++) {
          const val = selected[i].position.x + selected[i].width / 2;
          if (val > targetValue) targetValue = val;
        }
      }
      if (type === 'top') {
        targetValue =
          selected[0].height > 0
            ? selected[0].position.y - selected[0].height / 2
            : selected[0].position.y;
        for (let i = 1; i < selected.length; i++) {
          const val =
            selected[i].height > 0
              ? selected[i].position.y - selected[i].height / 2
              : selected[i].position.y;
          if (val < targetValue) targetValue = val;
        }
      }
      if (type === 'middle')
        targetValue =
          selected.reduce((acc, el) => acc + el.position.y, 0) /
          selected.length;
      if (type === 'bottom') {
        targetValue =
          selected[0].height > 0
            ? selected[0].position.y + selected[0].height / 2
            : selected[0].position.y;
        for (let i = 1; i < selected.length; i++) {
          const val =
            selected[i].height > 0
              ? selected[i].position.y + selected[i].height / 2
              : selected[i].position.y;
          if (val > targetValue) targetValue = val;
        }
      }

      const updates = selected.map((el) => {
        const newPos = { ...el.position };
        if (type === 'left') newPos.x = targetValue + el.width / 2;
        if (type === 'center') newPos.x = targetValue;
        if (type === 'right') newPos.x = targetValue - el.width / 2;
        if (type === 'top') newPos.y = targetValue + el.height / 2;
        if (type === 'middle') newPos.y = targetValue;
        if (type === 'bottom') newPos.y = targetValue - el.height / 2;
        return { id: el.id, position: newPos };
      });

      updateMultipleElements(updates, true);
    },
    [elements, selectedElementIds, updateMultipleElements],
  );

  const distributeSelected = useCallback(
    (type: 'horizontal' | 'vertical') => {
      const selected = [
        ...elements.filter((el) => selectedElementIds.includes(el.id)),
      ];
      if (selected.length <= 2) return;

      if (type === 'horizontal') {
        // Sort by left edge
        selected.sort(
          (a, b) => a.position.x - a.width / 2 - (b.position.x - b.width / 2),
        );
        const leftMost = selected[0].position.x - selected[0].width / 2;
        const rightMost =
          selected[selected.length - 1].position.x +
          selected[selected.length - 1].width / 2;
        const totalWidthOfItems = selected.reduce(
          (sum, el) => sum + el.width,
          0,
        );
        const totalGap = rightMost - leftMost - totalWidthOfItems;
        const gap = totalGap / (selected.length - 1);

        let currentX = leftMost;
        const updates = selected.map((el, i) => {
          const newX = currentX + el.width / 2;
          currentX += el.width + gap;
          return {
            id: el.id,
            position: { ...el.position, x: newX },
          };
        });
        updateMultipleElements(updates, true);
      } else {
        // Sort by top edge
        selected.sort(
          (a, b) => a.position.y - a.height / 2 - (b.position.y - b.height / 2),
        );
        const topMost = selected[0].position.y - selected[0].height / 2;
        const bottomMost =
          selected[selected.length - 1].position.y +
          selected[selected.length - 1].height / 2;
        const totalHeightOfItems = selected.reduce(
          (sum, el) => sum + el.height,
          0,
        );
        const totalGap = bottomMost - topMost - totalHeightOfItems;
        const gap = totalGap / (selected.length - 1);

        let currentY = topMost;
        const updates = selected.map((el, i) => {
          const newY = currentY + el.height / 2;
          currentY += el.height + gap;
          return {
            id: el.id,
            position: { ...el.position, y: newY },
          };
        });
        updateMultipleElements(updates, true);
      }
    },
    [elements, selectedElementIds, updateMultipleElements],
  );

  const tidyUpSelected = useCallback(() => {
    const selected = [
      ...elements.filter((el) => selectedElementIds.includes(el.id)),
    ];
    if (selected.length <= 1) return;

    // 1. 依照自然閱讀順序排序（先比 Y，差距不大再比 X）
    selected.sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) > 80)
        return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });

    // 2. 智慧計算佈局參數
    const padding = 60;
    const avgW = selected.reduce((s, el) => s + el.width, 0) / selected.length;

    // 計算選取物件組的邊界
    const allCorners = selected.flatMap((el) => {
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      return [
        { x: el.position.x - halfW, y: el.position.y - halfH },
        { x: el.position.x + halfW, y: el.position.y + halfH },
      ];
    });

    if (allCorners.length === 0) return;

    let minX = allCorners[0].x;
    let minY = allCorners[0].y;
    let maxX = allCorners[0].x;
    let maxY = allCorners[0].y;

    for (let i = 1; i < allCorners.length; i++) {
      const c = allCorners[i];
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x > maxX) maxX = c.x;
      if (c.y > maxY) maxY = c.y;
    }

    const groupWidth = maxX - minX;

    // 決定欄數 (基於平均寬度與選取區域總寬度)
    let cols = Math.floor(groupWidth / (avgW + padding));
    if (cols < 1) cols = 1;
    if (cols > selected.length) cols = selected.length;

    // 使用最大寬度/高度作為網格單元大小
    const cellW = Math.max(...selected.map((el) => el.width)) + padding;
    const cellH = Math.max(...selected.map((el) => el.height)) + padding;

    const updates = selected.map((el, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return {
        id: el.id,
        position: {
          x: minX + col * cellW + el.width / 2,
          y: minY + row * cellH + el.height / 2,
        },
        rotation: 0, // 整理時順便歸零旋轉
      };
    });

    updateMultipleElements(updates, true);
  }, [elements, selectedElementIds, updateMultipleElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingDrawing || editingImage || croppingImage || outpaintingState) {
        return;
      }

      const target = e.target as HTMLElement;
      const isEditingText =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) {
        e.preventDefault();
        deleteElement();
        return;
      }

      if (isCtrlOrCmd && !isEditingText) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          if (e.shiftKey) ungroupElements();
          else groupElements();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    deleteElement,
    undo,
    redo,
    editingDrawing,
    editingImage,
    croppingImage,
    outpaintingState,
    groupElements,
    ungroupElements,
  ]);

  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        if (
          Array.from(e.dataTransfer.items).some(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          )
        ) {
          setIsDraggingOver(true);
        }
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && canvasApiRef.current) {
        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith('image/'),
        );

        if (imageFiles.length > 0) {
          const dropPoint = { x: e.clientX, y: e.clientY };
          const worldPoint = canvasApiRef.current.screenToWorld(dropPoint);
          addImagesToCanvas(imageFiles, worldPoint);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addImagesToCanvas]);

  const bringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const maxZ = Math.max(...elements.map((el) => el.zIndex), 0);
    const selectedSet = new Set(selectedElementIds);
    setElements((prev) =>
      prev.map((el) =>
        selectedSet.has(el.id)
          ? ({ ...el, zIndex: maxZ + 1 } as CanvasElement)
          : el,
      ),
    );
    zIndexCounter.current = maxZ + 2;
  }, [selectedElementIds, elements, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    let minZ = 0;
    if (elements.length > 0) {
      minZ = elements[0].zIndex;
      for (let i = 1; i < elements.length; i++) {
        if (elements[i].zIndex < minZ) minZ = elements[i].zIndex;
      }
    }
    minZ = Math.min(minZ, 0);

    const selectedSet = new Set(selectedElementIds);
    setElements((prev) =>
      prev.map((el) =>
        selectedSet.has(el.id)
          ? ({ ...el, zIndex: minZ - 1 } as CanvasElement)
          : el,
      ),
    );
  }, [selectedElementIds, elements, setElements]);

  const getResetViewCallback = useCallback((callback: () => void) => {
    setResetView(() => callback);
  }, []);

  const selectedElements = elements.filter((el) =>
    selectedElementIds.includes(el.id),
  );
  const canChangeColor = selectedElements.some(
    (el) => el.type === 'note' || el.type === 'arrow',
  );
  const showImageEditInMenu =
    selectedElements.length === 1 && selectedElements[0].type === 'image';

  const handleColorChange = (newColor: string) => {
    if (!canChangeColor) return;
    const selectedSet = new Set(selectedElementIds);
    setElements((prev) =>
      prev.map((el) => {
        if (selectedSet.has(el.id)) {
          if (el.type === 'note')
            return { ...el, color: newColor } as CanvasElement;
          if (el.type === 'arrow') {
            const newTextColor = newColor.replace('bg-', 'text-');
            return { ...el, color: newTextColor } as CanvasElement;
          }
        }
        return el;
      }),
    );
  };

  const downloadGeneratedImage = (imageUrl: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-canvas-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = useCallback(
    (elementId: string) => {
      if (!elementId) return;
      const element = elements.find((el) => el.id === elementId);
      if (
        element &&
        (element.type === 'image' || element.type === 'drawing') &&
        element.src
      ) {
        const link = document.createElement('a');
        link.href = element.src;
        const mimeType =
          element.src.match(/data:(.*);base64/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        link.download = `canvas-image-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [elements],
  );

  const handleCopyToClipboard = useCallback(
    async (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      try {
        if (element.type === 'note') {
          await navigator.clipboard.writeText(element.content);
        } else if (element.type === 'image' || element.type === 'drawing') {
          const response = await fetch(element.src);
          const blob = await response.blob();

          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        }
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    },
    [elements],
  );

  const handleCopySelection = useCallback(async () => {
    const selected = elements.filter((el) =>
      selectedElementIds.includes(el.id),
    );
    if (selected.length === 0) return;

    if (selected.length === 1) {
      const el = selected[0];
      try {
        if (el.type === 'note') {
          await navigator.clipboard.writeText(el.content);
          return;
        } else if ((el.type === 'image' || el.type === 'drawing') && el.src) {
          const response = await fetch(el.src);
          const blob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          return;
        }
      } catch (err) {
        console.warn('Smart copy failed, falling back to JSON copy', err);
      }
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [elements, selectedElementIds]);

  const handlePasteFromClipboard = useCallback(async () => {
    const processTextContent = (text: string): boolean => {
      try {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        const validItems = items.filter((i: any) => i.type && i.position);

        if (validItems.length > 0) {
          const targetPos = getTargetPosition();

          let minX = validItems[0].position.x;
          let minY = validItems[0].position.y;

          for (let i = 1; i < validItems.length; i++) {
            const item = validItems[i];
            if (item.position.x < minX) minX = item.position.x;
            if (item.position.y < minY) minY = item.position.y;
          }

          const newElements = validItems.map((item: any) => ({
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            zIndex: zIndexCounter.current++,
            position: {
              x: item.position.x - minX + targetPos.x,
              y: item.position.y - minY + targetPos.y,
            },
          }));

          setElements((prev) => [...prev, ...newElements]);
          setSelectedElementIds(newElements.map((el: any) => el.id));
          return true;
        }
      } catch (e) {}

      const position = getTargetPosition();
      addElement({
        type: 'note',
        position,
        width: 200,
        height: 150,
        rotation: 0,
        content: text,
        color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
      });
      return true;
    };

    try {
      if (typeof navigator.clipboard.read === 'function') {
        try {
          const clipboardItems = await navigator.clipboard.read();
          let hasHandled = false;

          for (const item of clipboardItems) {
            const imageType = item.types.find((type) =>
              type.startsWith('image/'),
            );
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) {
                  const img = new Image();
                  img.onload = () => {
                    const MAX_DIMENSION = 300;
                    let { width, height } = img;
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                      if (width > height) {
                        height = (height / width) * MAX_DIMENSION;
                        width = MAX_DIMENSION;
                      } else {
                        width = (width / height) * MAX_DIMENSION;
                        height = MAX_DIMENSION;
                      }
                    }
                    addElement({
                      type: 'image',
                      position: getTargetPosition(),
                      src,
                      width,
                      height,
                      rotation: 0,
                    });
                  };
                  img.src = src;
                }
              };
              reader.readAsDataURL(blob);
              hasHandled = true;
              break;
            }

            if (!hasHandled && item.types.includes('text/plain')) {
              const blob = await item.getType('text/plain');
              const text = await blob.text();
              if (text) {
                hasHandled = processTextContent(text);
                if (hasHandled) break;
              }
            }
          }
          return;
        } catch (readErr: any) {
          const isNotAllowed =
            readErr.name === 'NotAllowedError' ||
            readErr.message?.includes('denied');
          if (isNotAllowed) return;
          throw readErr;
        }
      } else {
        throw new Error('Clipboard API read not supported');
      }
    } catch (err) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) processTextContent(text);
      } catch (textErr) {
        console.error('Paste failed:', textErr);
      }
    }
  }, [addElement, getTargetPosition, setElements]);

  const handleContextMenu = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      worldPoint: Point,
      elementId: string | null,
    ) => {
      e.preventDefault();

      const point = 'touches' in e ? e.touches[0] : e;
      if (!point) return;

      if (elementId && !selectedElementIds.includes(elementId)) {
        handleSelectElement(elementId, false);
      } else if (!elementId) {
        setSelectedElementIds([]);
      }
      setContextMenu({
        x: point.clientX,
        y: point.clientY,
        worldPoint,
        elementId,
      });
    },
    [selectedElementIds, handleSelectElement],
  );

  const handleExportCanvas = () => {
    const elementsWithAnalysis = elements.map((el) => {
      const analysis = analysisResults[el.id];
      if (analysis) {
        return { ...el, analysis };
      }
      return el;
    });

    const dataStr = JSON.stringify(elementsWithAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `infinite-canvas-export-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string')
          throw new Error('File could not be read.');
        const data = JSON.parse(result);

        let finalElements: CanvasElement[] = [];
        let finalAnalysisResults: Record<string, AnalysisResult> = {};

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item && typeof item === 'object' && item.id) {
              const { analysis, ...elementData } = item;
              finalElements.push(elementData as CanvasElement);
              if (analysis) finalAnalysisResults[item.id] = analysis;
            }
          });
        } else if (
          data &&
          typeof data === 'object' &&
          Array.isArray(data.elements)
        ) {
          finalElements = data.elements;
          finalAnalysisResults = data.analysisResults || {};
        } else {
          throw new Error('Invalid file format.');
        }

        setPendingImport({
          elements: finalElements,
          analysisResults: finalAnalysisResults,
        });
      } catch (error) {
        console.error('Error importing canvas:', error);
        setAiErrorMessage({
          en: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          zh: `匯入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        });
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const finalizeImport = (mode: 'replace' | 'merge') => {
    if (!pendingImport) return;

    const {
      elements: importedElements,
      analysisResults: importedAnalysisResults,
    } = pendingImport;

    if (mode === 'replace') {
      setElements(importedElements);
      setAnalysisResults(importedAnalysisResults);
      setAnalysisVisibility({});
      const maxZ = Math.max(0, ...importedElements.map((el) => el.zIndex || 0));
      zIndexCounter.current = maxZ + 1;
      resetView();
    } else {
      // Merge to Right Logic
      // 1. Find max X of existing
      const getRotatedCorners = (el: CanvasElement): Point[] => {
        const { x, y } = el.position;
        const { width, height, rotation } = el;
        const rad = rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const halfW = width / 2;
        const halfH = height / 2;
        return [
          {
            x: x + (-halfW * cos - -halfH * sin),
            y: y + (-halfW * sin + -halfH * cos),
          },
          {
            x: x + (halfW * cos - -halfH * sin),
            y: y + (halfW * sin + -halfH * cos),
          },
          {
            x: x + (halfW * cos - halfH * sin),
            y: y + (halfW * sin + halfH * cos),
          },
          {
            x: x + (-halfW * cos - halfH * sin),
            y: y + (-halfW * sin + halfH * cos),
          },
        ];
      };

      let existingMaxX = -Infinity;
      if (elements.length > 0) {
        elements.forEach((el) => {
          const corners = getRotatedCorners(el);
          corners.forEach((c) => {
            if (c.x > existingMaxX) existingMaxX = c.x;
          });
        });
      } else {
        existingMaxX = 0;
      }

      // 2. Find min X of imported
      let importedMinX = Infinity;
      importedElements.forEach((el) => {
        const corners = getRotatedCorners(el);
        corners.forEach((c) => {
          if (c.x < importedMinX) importedMinX = c.x;
        });
      });

      const padding = 200;
      const offsetX = existingMaxX - importedMinX + padding;

      const maxZ = Math.max(0, ...elements.map((el) => el.zIndex || 0));

      const newElements = importedElements.map((el) => {
        const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const updatedEl = {
          ...el,
          id: newId,
          zIndex: (el.zIndex || 0) + maxZ + 1,
          position: { ...el.position, x: el.position.x + offsetX },
        };
        // Handle analysis results mapping to new ID
        if (importedAnalysisResults[el.id]) {
          setAnalysisResults((prev) => ({
            ...prev,
            [newId]: importedAnalysisResults[el.id],
          }));
        }
        return updatedEl as CanvasElement;
      });

      setElements((prev) => [...prev, ...newElements]);
      zIndexCounter.current = maxZ + importedElements.length + 1;

      // Focus on the new elements
      if (canvasApiRef.current && newElements.length > 0) {
        const firstNew = newElements[0];
        canvasApiRef.current.panTo(firstNew.position);
      }
    }

    setPendingImport(null);
  };

  const duplicateElement = useCallback(
    (elementId: string) => {
      const elementToDuplicate = elements.find((el) => el.id === elementId);
      if (!elementToDuplicate) return;

      const commonProperties = {
        position: {
          x: elementToDuplicate.position.x + 20,
          y: elementToDuplicate.position.y + 20,
        },
        width: elementToDuplicate.width,
        height: elementToDuplicate.height,
        rotation: elementToDuplicate.rotation,
      };

      let newElement:
        | Omit<NoteElement, 'id' | 'zIndex'>
        | Omit<ImageElement, 'id' | 'zIndex'>
        | Omit<DrawingElement, 'id' | 'zIndex'>
        | Omit<ArrowElement, 'id' | 'zIndex'>;

      switch (elementToDuplicate.type) {
        case 'note':
          newElement = {
            ...commonProperties,
            type: 'note',
            content: elementToDuplicate.content,
            color: elementToDuplicate.color,
            textAlign: elementToDuplicate.textAlign,
          };
          break;
        case 'image':
          newElement = {
            ...commonProperties,
            type: 'image',
            src: elementToDuplicate.src,
          };
          break;
        case 'drawing':
          newElement = {
            ...commonProperties,
            type: 'drawing',
            src: elementToDuplicate.src,
          };
          break;
        case 'arrow':
          newElement = {
            ...commonProperties,
            type: 'arrow',
            start: {
              x: elementToDuplicate.start.x + 20,
              y: elementToDuplicate.start.y + 20,
            },
            end: {
              x: elementToDuplicate.end.x + 20,
              y: elementToDuplicate.end.y + 20,
            },
            color: elementToDuplicate.color,
          };
          break;
        default:
          return;
      }
      addElement(newElement);
    },
    [elements, addElement],
  );

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditingText =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isEditingText) return;

      event.preventDefault();
      const items = event.clipboardData?.items;
      if (!items) return;

      const position = getTargetPosition();
      const imageItem = Array.from(items).find((item) =>
        item.type.startsWith('image/'),
      );
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) addImagesToCanvas([file], position);
        return;
      }

      const textItem = Array.from(items).find(
        (item) => item.type === 'text/plain',
      );
      if (textItem) {
        textItem.getAsString((text) => {
          addElement({
            type: 'note',
            position,
            width: 200,
            height: 150,
            rotation: 0,
            content: text,
            color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
          });
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addElement, addImagesToCanvas, getTargetPosition]);

  const handleAnalyzeElement = useCallback(
    async (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (
        !element ||
        (element.type !== 'image' && element.type !== 'drawing') ||
        !element.src
      )
        return;

      setAnalyzingElementId(elementId);
      try {
        const [header, data] = element.src.split(',');
        const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';

        let resultJson: any;

        if (optimizationProvider === 'gemini') {
          const genAI = getAi();
          if (!genAI) {
            setAiErrorMessage({
              en: 'Gemini API Key is missing. Please check your model settings.',
              zh: '找不到 Gemini API Key，請在模型設定中輸入。',
            });
            setAnalyzingElementId(null);
            return;
          }
          const imagePart = { inlineData: { data, mimeType } };
          const modelName =
            optimizationModel === 'pro'
              ? 'gemini-3.1-pro-preview'
              : 'gemini-3-flash-preview';
          const config: any = {
            systemInstruction:
              "You are an expert AI prompt engineer. Use High Level thinking to analyze this image. Provide a detailed description and 2-3 creative style or composition suggestions to help optimize a prompt for image generation. Return JSON with 'description' and 'suggestions' array.",
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            thinkingConfig: {
              thinkingLevel: optimizationThinkingLevel.toUpperCase(),
            },
          };
          if (optimizationGrounding) {
            config.tools = [{ googleSearch: {} }];
          }

          const requestBody = {
            model: modelName,
            contents: {
              parts: [imagePart, { text: 'Analyze this image.' }],
            },
            config: config,
          };
          console.log('[API Request] Gemini Analyze Image:', {
            ...requestBody,
            contents: {
              parts: requestBody.contents.parts.map((p) =>
                'inlineData' in p
                  ? {
                      inlineData: {
                        mimeType: p.inlineData.mimeType,
                        data: '[BASE64_IMAGE_DATA]',
                      },
                    }
                  : p,
              ),
            },
          });

          const response = await genAI.models.generateContent(requestBody);
          console.log('[API Response] Gemini Analyze Image:', response.text);
          resultJson = JSON.parse(response.text);
        } else {
          if (!optimizationOpenaiApiKey) {
            setAiErrorMessage({
              en: 'OpenAI API Key for optimization is missing.',
              zh: '找不到 OpenAI API Key，請在模型設定中輸入。',
            });
            setAnalyzingElementId(null);
            return;
          }
          const requestBody: any = {
            model: optimizationOpenaiModel,
            messages: [
              {
                role: 'system',
                content:
                  "You are an expert AI prompt engineer. Use High Level thinking to analyze this image. Provide a detailed description and 2-3 creative style or composition suggestions to help optimize a prompt for image generation. Return JSON with 'description' (string) and 'suggestions' (array of strings).",
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analyze this image.' },
                  { type: 'image_url', image_url: { url: element.src } },
                ],
              },
            ],
            response_format: { type: 'json_object' },
          };
          if (optimizationThinkingLevel !== 'none') {
            requestBody.reasoning = { effort: optimizationThinkingLevel };
          }
          console.log('[API Request] OpenAI Analyze Image:', {
            ...requestBody,
            messages: requestBody.messages.map((m) =>
              m.role === 'user'
                ? {
                    ...m,
                    content: (m.content as any[]).map((c) =>
                      c.type === 'image_url'
                        ? {
                            type: 'image_url',
                            image_url: { url: '[BASE64_IMAGE_DATA]' },
                          }
                        : c,
                    ),
                  }
                : m,
            ),
          });

          const response = await fetch(
            `${optimizationOpenaiBaseUrl.replace(/\/$/, '')}/chat/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${optimizationOpenaiApiKey}`,
              },
              body: JSON.stringify(requestBody),
            },
          );
          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            console.error(
              '[API Error] OpenAI Analyze Image:',
              errData || response.statusText,
            );
            throw new Error(
              `OpenAI API Error: ${response.status} ${errData ? JSON.stringify(errData) : response.statusText}`,
            );
          }
          const dataResponse = await response.json();
          console.log('[API Response] OpenAI Analyze Image:', dataResponse);
          let content = dataResponse.choices[0].message.content;
          content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          resultJson = JSON.parse(content);
        }

        setAnalysisResults((prev) => ({
          ...prev,
          [elementId]: {
            en: {
              description: resultJson.description,
              suggestions: resultJson.suggestions,
            },
          },
        }));
        setAnalysisVisibility((prev) => ({ ...prev, [elementId]: true }));
        setUsageStats((prev) => ({
          ...prev,
          aiOperations: prev.aiOperations + 1,
        }));
      } catch (error) {
        handleAiError(error);
      } finally {
        setAnalyzingElementId(null);
      }
    },
    [
      getAi,
      elements,
      handleAiError,
      optimizationProvider,
      optimizationModel,
      optimizationGrounding,
      optimizationOpenaiBaseUrl,
      optimizationOpenaiApiKey,
      optimizationOpenaiModel,
    ],
  );

  const handleOptimizeNotePrompt = useCallback(
    async (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (!element || element.type !== 'note' || !element.content.trim())
        return;
      setAnalyzingElementId(elementId);
      try {
        let resultJson: any;

        if (optimizationProvider === 'gemini') {
          const genAI = getAi();
          if (!genAI) {
            setAiErrorMessage({
              en: 'Gemini API Key is missing. Please check your model settings.',
              zh: '找不到 Gemini API Key，請在模型設定中輸入。',
            });
            setAnalyzingElementId(null);
            return;
          }
          const modelName =
            optimizationModel === 'pro'
              ? 'gemini-3.1-pro-preview'
              : 'gemini-3-flash-preview';
          const config: any = {
            systemInstruction: `You are an expert AI prompt engineer. Use High Level thinking to optimize the prompt for image generation. Return JSON with 'description' and 'suggestions' array.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            thinkingConfig: {
              thinkingLevel: optimizationThinkingLevel.toUpperCase(),
            },
          };
          if (optimizationGrounding) {
            config.tools = [{ googleSearch: {} }];
          }

          const requestBody = {
            model: modelName,
            contents: element.content,
            config: config,
          };
          console.log('[API Request] Gemini Optimize Note:', requestBody);

          const response = await genAI.models.generateContent(requestBody);
          console.log('[API Response] Gemini Optimize Note:', response.text);
          resultJson = JSON.parse(response.text);
        } else {
          if (!optimizationOpenaiApiKey) {
            setAiErrorMessage({
              en: 'OpenAI API Key for optimization is missing.',
              zh: '找不到 OpenAI API Key，請在模型設定中輸入。',
            });
            setAnalyzingElementId(null);
            return;
          }
          const requestBody: any = {
            model: optimizationOpenaiModel,
            messages: [
              {
                role: 'system',
                content:
                  "You are an expert AI prompt engineer. Use High Level thinking to optimize the prompt for image generation. Return JSON with 'description' (string) and 'suggestions' (array of strings).",
              },
              {
                role: 'user',
                content: element.content,
              },
            ],
            response_format: { type: 'json_object' },
          };
          if (optimizationThinkingLevel !== 'none') {
            requestBody.reasoning = { effort: optimizationThinkingLevel };
          }
          console.log('[API Request] OpenAI Optimize Note:', requestBody);

          const response = await fetch(
            `${optimizationOpenaiBaseUrl.replace(/\/$/, '')}/chat/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${optimizationOpenaiApiKey}`,
              },
              body: JSON.stringify(requestBody),
            },
          );
          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            console.error(
              '[API Error] OpenAI Optimize Note:',
              errData || response.statusText,
            );
            throw new Error(
              `OpenAI API Error: ${response.status} ${errData ? JSON.stringify(errData) : response.statusText}`,
            );
          }
          const dataResponse = await response.json();
          console.log('[API Response] OpenAI Optimize Note:', dataResponse);
          let content = dataResponse.choices[0].message.content;
          content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          resultJson = JSON.parse(content);
        }

        setAnalysisResults((prev) => ({
          ...prev,
          [elementId]: { en: resultJson },
        }));
        setAnalysisVisibility((prev) => ({ ...prev, [elementId]: true }));
        setUsageStats((prev) => ({
          ...prev,
          aiOperations: prev.aiOperations + 1,
        }));
      } catch (error) {
        handleAiError(error);
      } finally {
        setAnalyzingElementId(null);
      }
    },
    [
      getAi,
      elements,
      handleAiError,
      optimizationProvider,
      optimizationModel,
      optimizationGrounding,
      optimizationOpenaiBaseUrl,
      optimizationOpenaiApiKey,
      optimizationOpenaiModel,
    ],
  );

  const handleToggleAnalysisVisibility = useCallback((elementId: string) => {
    setAnalysisVisibility((prev) => ({
      ...prev,
      [elementId]: !prev[elementId],
    }));
  }, []);

  const handleClearAnalysis = useCallback((elementId: string) => {
    setAnalysisResults((prev) => {
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
    setAnalysisVisibility((prev) => {
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  const handleTranslateAnalysis = useCallback(
    async (elementId: string) => {
      const genAI = getAi();
      if (!genAI) {
        setAiErrorMessage({
          en: 'Gemini API Key is missing. Please check your model settings.',
          zh: '找不到 Gemini API Key，請在模型設定中輸入。',
        });
        return;
      }
      const analysis = analysisResults[elementId];
      if (!analysis || analysis.zh) return;
      setTranslatingElementId(elementId);
      try {
        const prompt = `Translate this JSON object values to Traditional Chinese. Keep structure:\n\n${JSON.stringify(analysis.en)}`;
        const requestBody = {
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        };
        console.log('[API Request] Gemini Translate Analysis:', requestBody);

        const response = await genAI.models.generateContent(requestBody);
        console.log('[API Response] Gemini Translate Analysis:', response.text);
        setAnalysisResults((prev) => ({
          ...prev,
          [elementId]: { ...prev[elementId], zh: JSON.parse(response.text) },
        }));
        setUsageStats((prev) => ({
          ...prev,
          aiOperations: prev.aiOperations + 1,
        }));
      } catch (error) {
        handleAiError(error);
      } finally {
        setTranslatingElementId(null);
      }
    },
    [getAi, analysisResults, handleAiError],
  );

  const contextMenuElement = contextMenu?.elementId
    ? elements.find((el) => el.id === contextMenu.elementId)
    : null;

  return (
    <main
      className="relative w-screen h-screen bg-gray-100 font-sans"
      onClick={() => setContextMenu(null)}
    >
      <div
        className={`absolute top-4 z-20 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 w-72 flex flex-col gap-4 transition-all duration-300 ease-in-out ${isMenuCollapsed ? (panelAlignment === 'left' ? '-translate-x-full' : 'translate-x-full') : 'translate-x-0'} ${panelAlignment === 'left' ? 'left-4' : 'right-4'} max-h-[calc(100vh-2rem)] overflow-y-auto`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-blue-600 flex items-center gap-1">
              <span className="text-2xl">🍌</span> {t('infiniteCanvas')}
            </h1>
            <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black">
              Nano Banana 2 | Nano Banana Pro
            </p>
          </div>
        </div>

        {/* Model Priority Selection */}
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
            {t('modelPriority')}
          </h2>

          <select
            value={apiProvider}
            onChange={(e) => setApiProvider(e.target.value as any)}
            className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700 font-medium"
          >
            <option value="builtin">{t('builtinAPIKey')}</option>
            <option value="custom_gemini">{t('customGeminiAPIKey')}</option>
            <option value="openai">{t('customOpenAIAPI')}</option>
          </select>

          {apiProvider === 'custom_gemini' && (
            <input
              type="password"
              placeholder="Gemini API Key"
              value={customGeminiKey}
              onChange={(e) => setCustomGeminiKey(e.target.value)}
              className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
            />
          )}

          {apiProvider === 'openai' && (
            <>
              <input
                type="text"
                placeholder="Base URL (e.g. https://api.openai.com/v1)"
                value={openaiBaseUrl}
                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
              />
              <input
                type="password"
                placeholder="OpenAI API Key"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
              />
            </>
          )}

          {apiProvider !== 'openai' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-200/50 rounded-md">
              <button
                onClick={() => setGenerationModel('flash')}
                className={`text-xs font-bold py-1.5 rounded transition-all ${generationModel === 'flash' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('speedFlash')}
              </button>
              <button
                onClick={() => setGenerationModel('pro')}
                className={`text-xs font-bold py-1.5 rounded transition-all ${generationModel === 'pro' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('qualityPro')}
              </button>
            </div>
          )}
          <p className="text-[10px] text-center mt-1.5 text-gray-500 font-medium">
            {apiProvider === 'openai'
              ? '使用 gpt-image-1.5'
              : generationModel === 'flash'
                ? t('usingFlash')
                : t('usingPro')}
          </p>
        </div>

        {/* Optimization Settings */}
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
            {t('aiPromptOptimization')}
          </h2>

          <select
            value={optimizationProvider}
            onChange={(e) => setOptimizationProvider(e.target.value as any)}
            className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700 font-medium"
          >
            <option value="gemini">{t('geminiFollowAPI')}</option>
            <option value="openai">{t('openAIAPI')}</option>
          </select>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Thinking:</span>
            <select
              value={optimizationThinkingLevel}
              onChange={(e) => setOptimizationThinkingLevel(e.target.value)}
              className="flex-1 text-xs p-1 border rounded bg-white text-gray-700"
            >
              {optimizationProvider === 'gemini' ? (
                optimizationModel === 'flash' ? (
                  <>
                    <option value="minimal">Minimal</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </>
                ) : (
                  <>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </>
                )
              ) : (
                <>
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="xhigh">XHigh</option>
                </>
              )}
            </select>
          </div>

          {optimizationProvider === 'gemini' ? (
            <>
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-200/50 rounded-md mb-2">
                <button
                  onClick={() => setOptimizationModel('flash')}
                  className={`text-xs font-bold py-1.5 rounded transition-all ${optimizationModel === 'flash' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Gemini 3 Flash
                </button>
                <button
                  onClick={() => setOptimizationModel('pro')}
                  className={`text-xs font-bold py-1.5 rounded transition-all ${optimizationModel === 'pro' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Gemini 3.1 Pro
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Base URL (預設: https://api.openai.com/v1)"
                value={optimizationOpenaiBaseUrl}
                onChange={(e) => setOptimizationOpenaiBaseUrl(e.target.value)}
                className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
              />
              <input
                type="password"
                placeholder="API Key"
                value={optimizationOpenaiApiKey}
                onChange={(e) => setOptimizationOpenaiApiKey(e.target.value)}
                className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
              />
              <input
                type="text"
                placeholder="Model Name (預設: gpt-4o)"
                value={optimizationOpenaiModel}
                onChange={(e) => setOptimizationOpenaiModel(e.target.value)}
                className="w-full text-xs p-1.5 mb-2 border rounded bg-white text-gray-700"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addNote()}
            className="px-3 py-2.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all flex flex-col items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t('addNote')}
          </button>
          <button
            onClick={() => addArrow()}
            className="px-3 py-2.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-all flex flex-col items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            {t('addArrow')}
          </button>
          <button
            onClick={() => addDrawing()}
            className="px-3 py-2.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-all flex flex-col items-center gap-1 col-span-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {t('addDrawing')}
          </button>
          <label className="cursor-pointer px-3 py-2.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm transition-all flex flex-col items-center gap-1 col-span-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t('addImages')}
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="hidden"
              onChange={handleImageUpload}
              multiple
            />
          </label>
          <button
            onClick={() => {
              setUrlPromptValue('https://');
              setIsUrlPromptOpen(true);
            }}
            className="px-3 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex flex-col items-center gap-1 col-span-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            {t('addWebpage')}
          </button>
        </div>

        {/* Generation Count */}
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
            {t('generationCount')}
          </h2>
          <div className="flex gap-1">
            {[1, 2, 4, 8].map((num) => (
              <button
                key={num}
                onClick={() => setGenerationCount(num)}
                className={`flex-1 py-1 rounded text-xs font-bold transition-all ${Number(generationCount) === num ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200/50'}`}
              >
                {num}
              </button>
            ))}
            <input
              type="text"
              placeholder="?"
              value={
                ![1, 2, 4, 8].includes(Number(generationCount))
                  ? generationCount
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setGenerationCount(val ? Number(val) : '');
              }}
              className={`w-8 text-center text-xs font-bold rounded border transition-all ${![1, 2, 4, 8].includes(Number(generationCount)) && generationCount !== '' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-200/50'}`}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            {t('layout')}
          </h2>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="snapGrid"
              checked={snapToGrid}
              onChange={() => setSnapToGrid(!snapToGrid)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="snapGrid"
              className="text-xs font-bold text-gray-700 cursor-pointer"
            >
              {t('snapToGrid')}
            </label>
          </div>
          {selectedElementIds.length > 1 ? (
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => alignSelected('left')}
                title={t('alignLeft')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 2v20M8 6h12M8 12h8M8 18h10" />
                </svg>
              </button>
              <button
                onClick={() => alignSelected('center')}
                title={t('alignCenter')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v20M6 6h12M8 12h8M6 18h12" />
                </svg>
              </button>
              <button
                onClick={() => alignSelected('right')}
                title={t('alignRight')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 2v20M4 6h12M8 12h8M4 18h10" />
                </svg>
              </button>
              <button
                onClick={() => alignSelected('top')}
                title={t('alignTop')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 4h20M6 8v12M12 8v8M18 8v10" />
                </svg>
              </button>
              <button
                onClick={() => alignSelected('middle')}
                title={t('alignMiddle')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 12h20M6 6h12M12 8h8M18 6h6" />
                </svg>
              </button>
              <button
                onClick={() => alignSelected('bottom')}
                title={t('alignBottom')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 20h20M6 4v12M12 4v8M18 4v10" />
                </svg>
              </button>
              <button
                onClick={() => distributeSelected('horizontal')}
                title={t('distributeHorizontally')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 2v20M20 2v20M10 6v12M14 6v12" />
                </svg>
              </button>
              <button
                onClick={() => distributeSelected('vertical')}
                title={t('distributeVertically')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 4h20M2 20h20M6 10h12M6 14h12" />
                </svg>
              </button>
              <button
                onClick={tidyUpSelected}
                title={t('tidyUp')}
                className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md flex justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 italic">
              {t('selectObjectToTransform')}
            </p>
          )}
        </div>

        {showImageEditInMenu && (
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {t('imageEdit')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStartImageEdit(selectedElementIds[0])}
                className="px-2 py-2 text-[11px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                {t('removeOrEditObject')}
              </button>
              <button
                onClick={() => handleStartOutpainting(selectedElementIds[0])}
                className="px-2 py-2 text-[11px] font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all"
              >
                {t('expandImage')}
              </button>
              <button
                onClick={() => handleStartCrop(selectedElementIds[0])}
                className="px-2 py-2 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all col-span-2"
              >
                {t('cropImage')}
              </button>
            </div>
          </div>
        )}

        {selectedElementIds.length > 0 && canChangeColor && (
          <div className="border-t border-gray-100 pt-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
              {t('color')}
            </h2>
            <div className="grid grid-cols-8 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.bg)}
                  className={`w-6 h-6 rounded-md border border-black/5 ${color.bg} hover:scale-110 transition-transform`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            {t('controls')}
          </h2>
          <div className="mb-1">
            <div className="w-full bg-gray-100 rounded-lg p-1 grid grid-cols-2 gap-1">
              <button
                onClick={() => setInteractionMode('pan')}
                className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${interactionMode === 'pan' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('panMode')}
              </button>
              <button
                onClick={() => setInteractionMode('select')}
                className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${interactionMode === 'select' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('selectMode')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={handleCopySelection}
              disabled={selectedElementIds.length === 0}
              className="px-2 py-2 text-xs font-bold bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {t('copyToClipboard')}
            </button>
            <button
              onClick={handlePasteFromClipboard}
              className="px-2 py-2 text-xs font-bold bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              {t('pasteFromClipboard')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportCanvas}
              className="px-2 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all"
            >
              {t('export')}
            </button>
            <label className="cursor-pointer text-center px-2 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all">
              {t('import')}
              <input
                type="file"
                accept=".json"
                ref={importInputRef}
                className="hidden"
                onChange={handleImportCanvas}
              />
            </label>
            <button
              onClick={undo}
              disabled={!canUndo}
              className="px-2 py-2 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              {t('undo')}
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="px-2 py-2 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              {t('redo')}
            </button>
            <button
              onClick={groupElements}
              disabled={!getSelectedGroupInfo.canGroup}
              className="px-2 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              {t('group')}
            </button>
            <button
              onClick={ungroupElements}
              disabled={!getSelectedGroupInfo.canUngroup}
              className="px-2 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {t('ungroup')}
            </button>
            <button
              onClick={bringToFront}
              disabled={selectedElementIds.length === 0}
              className="px-2 py-2 text-[10px] font-bold bg-gray-800 text-white rounded-lg hover:bg-black disabled:opacity-30 transition-all truncate"
            >
              {t('bringToFront')}
            </button>
            <button
              onClick={sendToBack}
              disabled={selectedElementIds.length === 0}
              className="px-2 py-2 text-[10px] font-bold bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 transition-all truncate"
            >
              {t('sendToBack')}
            </button>
            <button
              onClick={deleteElement}
              disabled={selectedElementIds.length === 0}
              className="px-2 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-30 transition-all col-span-1"
            >
              {t('delete')}
            </button>
            <button
              onClick={resetView}
              className="px-2 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all col-span-1"
            >
              {t('resetView')}
            </button>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 mb-2">
              {t('settings')}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 text-sm font-bold bg-gray-100 rounded-lg"
              >
                {t('changeLanguage')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
        className="absolute top-4 z-20 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-gray-200 hover:bg-gray-100 transition-all duration-300 ease-in-out"
        style={{
          [panelAlignment]: isMenuCollapsed
            ? '1rem'
            : 'calc(1rem + 18rem + 0.5rem)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-700 transition-transform ${isMenuCollapsed ? (panelAlignment === 'left' ? 'rotate-180' : '') : panelAlignment === 'left' ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <InfiniteCanvas
        ref={canvasApiRef}
        elements={elements}
        selectedElementIds={selectedElementIds}
        onSelectElement={handleSelectElement}
        onMarqueeSelect={handleMarqueeSelect}
        onUpdateElement={updateElements}
        onUpdateMultipleElements={updateMultipleElements}
        onInteractionEnd={handleInteractionEnd}
        setResetViewCallback={getResetViewCallback}
        onGenerate={handleGenerate}
        onContextMenu={handleContextMenu}
        onEditDrawing={handleEditDrawing}
        onMouseMove={handleCanvasMouseMove}
        onViewportChange={handleViewportChange}
        imageStyle={imageStyle}
        onSetImageStyle={setImageStyle}
        imageAspectRatio={imageAspectRatio}
        onSetImageAspectRatio={setImageAspectRatio}
        outpaintingState={outpaintingState}
        onUpdateOutpaintingFrame={handleUpdateOutpaintingFrame}
        onCancelOutpainting={handleCancelOutpainting}
        onOutpaintingGenerate={handleOutpaintingGenerate}
        onAutoPromptGenerate={handleAutoPromptGenerate}
        interactionMode={interactionMode}
        t={t}
        language={language}
        analysisResults={analysisResults}
        analyzingElementId={analyzingElementId}
        onAnalyzeElement={handleAnalyzeElement}
        onOptimizeNotePrompt={handleOptimizeNotePrompt}
        analysisVisibility={analysisVisibility}
        onToggleAnalysisVisibility={handleToggleAnalysisVisibility}
        onClearAnalysis={handleClearAnalysis}
        onTranslateAnalysis={handleTranslateAnalysis}
        translatingElementId={translatingElementId}
        generationModel={generationModel}
        imageSize={imageSize}
        onSetImageSize={setImageSize}
        generationGoogleSearch={generationGoogleSearch}
        onSetGenerationGoogleSearch={setGenerationGoogleSearch}
        generationImageSearch={generationImageSearch}
        onSetGenerationImageSearch={setGenerationImageSearch}
        generationThinkingLevel={generationThinkingLevel}
        onSetGenerationThinkingLevel={setGenerationThinkingLevel}
        onUrlDrop={addIFrame}
      />

      <GenerationPanel
        isGenerating={isGenerating}
        images={generationHistory}
        onAddToCanvas={addGeneratedImageToCanvas}
        onDelete={handleDeleteGeneratedImage}
        t={t}
      />

      {isUrlPromptOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {t('addWebpage')}
            </h2>
            <input
              type="url"
              value={urlPromptValue}
              onChange={(e) => setUrlPromptValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              placeholder="https://"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addIFrame(urlPromptValue);
                  setIsUrlPromptOpen(false);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsUrlPromptOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  addIFrame(urlPromptValue);
                  setIsUrlPromptOpen(false);
                }}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      <Minimap
        elements={elements}
        viewport={viewport}
        onPanTo={handlePanTo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        usageStats={usageStats}
        t={t}
      />

      {isGenerating && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-lg">
              🍌
            </div>
          </div>
          <div className="flex flex-col min-w-[120px]">
            <p className="text-sm font-bold text-gray-800">
              {t('generatingImages')}
            </p>
            <p className="text-[10px] text-blue-500 animate-pulse">
              {t('thisMayTakeAMoment')}
            </p>
          </div>
          <button
            onClick={handleCancelGeneration}
            className="ml-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {t('cancel')}
          </button>
        </div>
      )}

      {editingDrawing && (
        <DrawingModal
          element={editingDrawing}
          onSave={handleSaveDrawing}
          onClose={() => setEditingDrawing(null)}
          t={t}
        />
      )}
      {editingImage && (
        <ImageEditModal
          element={editingImage}
          onSave={handleSaveImageEdit}
          onClose={() => setEditingImage(null)}
          getAi={getAi}
          handleAiError={handleAiError}
          t={t}
        />
      )}
      {croppingImage && (
        <CropModal
          element={croppingImage}
          onSave={handleSaveCrop}
          onClose={() => setCroppingImage(null)}
          t={t}
        />
      )}

      {/* Pending Import Selection Modal */}
      {pendingImport && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col gap-6 transform animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0l-4 4m4-4v12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                {t('importTitle')}
              </h2>
              <p className="text-gray-500 font-medium">{t('importDesc')}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => finalizeImport('merge')}
                className="group w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl flex items-center gap-4 transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-blue-800">
                    {t('importMerge')}
                  </div>
                  <div className="text-xs text-blue-600/80 font-bold">
                    {t('importMergeDesc')}
                  </div>
                </div>
              </button>

              <button
                onClick={() => finalizeImport('replace')}
                className="group w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center gap-4 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gray-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-gray-800">
                    {t('importReplace')}
                  </div>
                  <div className="text-xs text-gray-600/80 font-bold">
                    {t('importReplaceDesc')}
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPendingImport(null)}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          menuData={contextMenu}
          onClose={() => setContextMenu(null)}
          actions={{
            addNote,
            addArrow,
            addDrawing,
            addIFrame: () => {
              setUrlPromptValue('https://');
              setIsUrlPromptOpen(true);
            },
            editDrawing: handleEditDrawing,
            startImageEdit: handleStartImageEdit,
            startOutpainting: handleStartOutpainting,
            startCrop: handleStartCrop,
            addImage: triggerImageUpload,
            deleteElement,
            bringToFront,
            sendToBack,
            changeColor: handleColorChange,
            downloadImage,
            duplicateElement,
            toggleLanguage,
            groupElements,
            ungroupElements,
            copyToClipboard: handleCopyToClipboard,
            tidyUp: tidyUpSelected,
          }}
          canChangeColor={canChangeColor}
          canGroup={getSelectedGroupInfo.canGroup}
          canUngroup={getSelectedGroupInfo.canUngroup}
          selectedCount={selectedElementIds.length}
          elementType={contextMenuElement?.type || null}
          t={t}
        />
      )}

      {aiErrorMessage && (
        <div
          className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setAiErrorMessage(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col gap-6 transform animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-800">
                  {t('aiErrorTitle')}
                </h2>
              </div>
              <button
                onClick={() => setAiErrorMessage(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 font-medium">{t('aiErrorDesc')}</p>

            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">
                  Original Error (English)
                </div>
                <p className="text-sm font-mono text-gray-700 break-words leading-relaxed">
                  {aiErrorMessage.en}
                </p>
              </div>

              {language === 'zh' && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="text-[10px] uppercase tracking-widest font-black text-blue-400 mb-2">
                    中文翻譯 (Chinese Translation)
                  </div>
                  <p className="text-base font-bold text-blue-900 leading-relaxed">
                    {aiErrorMessage.zh}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setAiErrorMessage(null)}
              className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-[0.98]"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {isDraggingOver && (
        <div className="absolute inset-0 z-[100] bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none border-8 border-dashed border-blue-500 m-4 rounded-3xl">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
            <span className="text-6xl mb-4 block">📸</span>
            <p className="text-2xl font-black text-gray-800">
              Drop to import images
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
