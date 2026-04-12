export interface Point {
  x: number;
  y: number;
}

export type ElementType = 'note' | 'image' | 'arrow' | 'drawing';

interface BaseElement {
  id: string;
  position: Point;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  groupId?: string;
}

export interface NoteElement extends BaseElement {
  type: 'note';
  content: string;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  start: Point;
  end: Point;
  color: string;
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  src: string; // base64 data URL
}

export interface IFrameElement extends BaseElement {
  type: 'iframe';
  url: string;
  isActivated: boolean;
  sourceMode: 'viewport' | 'fullpage';
}

export type CanvasElement = NoteElement | ImageElement | ArrowElement | DrawingElement | IFrameElement;

export interface AnalysisContent {
    description: string;
    suggestions: string[];
}

export interface AnalysisResult {
    en: AnalysisContent;
    zh?: AnalysisContent;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export {};