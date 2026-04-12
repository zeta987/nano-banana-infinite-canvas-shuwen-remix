import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawingElement, Point } from '../types';

interface DrawingModalProps {
  element: DrawingElement;
  onSave: (elementId: string, dataUrl: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const BRUSH_SIZES = [2, 5, 10, 20, 30];
const COLORS = [
  '#000000',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

// Use a large, fixed-size canvas for a better drawing experience
const CANVAS_INTERNAL_WIDTH = 1200;
const CANVAS_INTERNAL_HEIGHT = 900;

type Tool =
  | 'pencil'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'arrow';

// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const SHAPE_TOOLS: { name: Tool; icon: React.ReactElement }[] = [
  {
    name: 'line',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="19" x2="19" y2="5"></line>
      </svg>
    ),
  },
  {
    name: 'rectangle',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
    ),
  },
  {
    name: 'circle',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ),
  },
  {
    name: 'triangle',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 22h20L12 2z"></path>
      </svg>
    ),
  },
  {
    name: 'star',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    ),
  },
  {
    name: 'arrow',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    ),
  },
];

const drawLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};

const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
) => {
  ctx.beginPath();
  ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  ctx.stroke();
};

const drawCircle = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
) => {
  const radius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
  );
  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
  ctx.stroke();
};

const drawTriangle = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(start.x * 2 - end.x, end.y);
  ctx.closePath();
  ctx.stroke();
};

const drawStar = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  points = 5,
) => {
  const outerRadius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
  );
  const innerRadius = outerRadius / 2;
  let rot = (Math.PI / 2) * 3;
  let x = start.x;
  let y = start.y;
  const step = Math.PI / points;

  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    x = start.x + Math.cos(rot) * outerRadius;
    y = start.y + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = start.x + Math.cos(rot) * innerRadius;
    y = start.y + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.closePath();
  ctx.stroke();
};

const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
  const headlen = ctx.lineWidth * 5;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(
    end.x - headlen * Math.cos(angle - Math.PI / 6),
    end.y - headlen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headlen * Math.cos(angle + Math.PI / 6),
    end.y - headlen * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
};

export const DrawingModal: React.FC<DrawingModalProps> = ({
  element,
  onSave,
  onClose,
  t,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Undo/Redo state
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Shape drawing state
  const shapeStartPointRef = useRef<Point | null>(null);
  const shapeEndPointRef = useRef<Point | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const saveHistoryState = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    const imageData = context.getImageData(
      0,
      0,
      context.canvas.width,
      context.canvas.height,
    );

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, imageData];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (contextRef.current && history[newIndex]) {
        contextRef.current.putImageData(history[newIndex], 0, 0);
      }
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (contextRef.current && history[newIndex]) {
        contextRef.current.putImageData(history[newIndex], 0, 0);
      }
    }
  }, [canRedo, history, historyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set a fixed internal resolution for the canvas
    canvas.width = CANVAS_INTERNAL_WIDTH;
    canvas.height = CANVAS_INTERNAL_HEIGHT;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    const loadAndInitialize = () => {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (element.src) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          saveHistoryState();
        };
        img.src = element.src;
      } else {
        saveHistoryState();
      }
    };

    loadAndInitialize();
  }, [element.src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const getPointFromEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const pointSource = 'touches' in e ? e.touches[0] : e;
      if (!pointSource) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (pointSource.clientX - rect.left) * scaleX,
        y: (pointSource.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (
        ('button' in e && e.button !== 0) ||
        ('touches' in e && e.touches.length > 1)
      ) {
        return;
      }
      e.preventDefault();

      const point = getPointFromEvent(e);
      const context = contextRef.current;
      if (!point || !context) return;

      setIsDrawing(true);

      const isShapeTool = SHAPE_TOOLS.some((s) => s.name === tool);
      if (isShapeTool) {
        shapeStartPointRef.current = point;
        snapshotRef.current = context.getImageData(
          0,
          0,
          context.canvas.width,
          context.canvas.height,
        );
      } else {
        // Pencil or Eraser
        context.strokeStyle = color;
        context.lineWidth = brushSize;
        context.globalCompositeOperation =
          tool === 'pencil' ? 'source-over' : 'destination-out';
        context.beginPath();
        context.moveTo(point.x, point.y);
      }
    },
    [tool, color, brushSize, getPointFromEvent],
  );

  const finishDrawing = useCallback(() => {
    if (!isDrawing) return;

    const context = contextRef.current;
    if (!context) return;

    const isShapeTool = SHAPE_TOOLS.some((s) => s.name === tool);

    if (isShapeTool) {
      if (snapshotRef.current) {
        context.putImageData(snapshotRef.current, 0, 0);
      }
      if (shapeStartPointRef.current && shapeEndPointRef.current) {
        drawShape(
          context,
          tool,
          shapeStartPointRef.current,
          shapeEndPointRef.current,
        );
      }
    } else {
      contextRef.current?.closePath();
    }

    setIsDrawing(false);
    saveHistoryState();

    shapeStartPointRef.current = null;
    shapeEndPointRef.current = null;
    snapshotRef.current = null;
  }, [isDrawing, saveHistoryState, tool]);

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: Tool,
    start: Point,
    end: Point,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
    switch (shape) {
      case 'line':
        drawLine(ctx, start, end);
        break;
      case 'rectangle':
        drawRectangle(ctx, start, end);
        break;
      case 'circle':
        drawCircle(ctx, start, end);
        break;
      case 'triangle':
        drawTriangle(ctx, start, end);
        break;
      case 'star':
        drawStar(ctx, start, end);
        break;
      case 'arrow':
        drawArrow(ctx, start, end);
        break;
    }
  };

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      if ('touches' in e && e.touches.length > 1) return;
      e.preventDefault();

      const point = getPointFromEvent(e);
      const context = contextRef.current;
      if (!point || !context) return;

      const isShapeTool = SHAPE_TOOLS.some((s) => s.name === tool);

      if (isShapeTool) {
        if (!snapshotRef.current || !shapeStartPointRef.current) return;
        shapeEndPointRef.current = point;
        context.putImageData(snapshotRef.current, 0, 0);
        drawShape(context, tool, shapeStartPointRef.current, point);
      } else {
        // Pencil or Eraser
        context.lineTo(point.x, point.y);
        context.stroke();
      }
    },
    [isDrawing, getPointFromEvent, tool, color, brushSize],
  );

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      saveHistoryState();
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(element.id, dataUrl);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleToolSelect = (selectedTool: Tool) => {
    setTool(selectedTool);
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{t('drawingPad')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-2 border-b flex flex-wrap items-center gap-4 bg-gray-100 flex-shrink-0">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToolSelect('pencil')}
              title={t('pencil')}
              className={`p-2 rounded ${tool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <button
              onClick={() => handleToolSelect('eraser')}
              title={t('eraser')}
              className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.49 4.51a2.828 2.828 0 0 0-4-4L5 11.51l-4 4.5 1.5 1.5 4.5-4L20.49 4.51zM11 5l9 9"></path>
              </svg>
            </button>
          </div>
          {/* Shapes */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
            <span className="text-sm font-medium text-gray-700">
              {t('shapes')}:
            </span>
            {SHAPE_TOOLS.map(({ name, icon }) => (
              <button
                key={name}
                onClick={() => handleToolSelect(name)}
                title={t(name)}
                className={`p-2 rounded ${tool === name ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'}`}
              >
                <div className="w-5 h-5">{icon}</div>
              </button>
            ))}
          </div>
          {/* Undo/Redo */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded ${!canUndo ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-200'}`}
            >
              {t('undo')}
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded ${!canRedo ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-200'}`}
            >
              {t('redo')}
            </button>
          </div>
          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {t('size')}:
            </span>
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${brushSize === size ? 'ring-2 ring-blue-500' : ''} bg-gray-200`}
              >
                <span
                  className="block rounded-full bg-black"
                  style={{ width: size, height: size }}
                ></span>
              </button>
            ))}
          </div>
          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {t('color')}:
            </span>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
              {showColorPicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10">
                  <input
                    type="color"
                    value={color}
                    onChange={handleColorChange}
                    className="w-12 h-12 p-0 border-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={clearCanvas}
            className="ml-auto p-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            {t('clear')}
          </button>
        </div>

        <div className="flex-grow p-4 bg-gray-200 flex items-center justify-center overflow-auto">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={finishDrawing}
            onTouchCancel={finishDrawing}
            onTouchMove={draw}
            className="bg-white shadow-lg cursor-crosshair max-w-full max-h-full"
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('saveDrawing')}
          </button>
        </div>
      </div>
    </div>
  );
};
