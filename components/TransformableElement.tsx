import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type {
  CanvasElement,
  Point,
  ArrowElement,
  AnalysisResult,
} from '../types';

interface TransformableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isMultiSelect: boolean;
  isOutpainting: boolean;
  zoom: number;
  onSelect: (id: string, shiftKey: boolean) => void;
  onUpdate: (
    element: CanvasElement,
    metadata?: {
      interactionType?: NonNullable<Interaction>['type'];
      dragDelta?: Point;
    },
  ) => void;
  onInteractionEnd: () => void;
  onContextMenu: (
    e: React.MouseEvent | React.TouchEvent,
    elementId: string,
  ) => void;
  onEditDrawing: (elementId: string) => void;
  t: (key: string) => string;
  language: 'en' | 'zh';
  analysis?: AnalysisResult;
  isAnalysisVisible: boolean;
  isAnalyzing: boolean;
  onAnalyzeElement: (elementId: string) => void;
  onOptimizeNotePrompt: (elementId: string) => void;
  onToggleAnalysisVisibility: (elementId: string) => void;
  onClearAnalysis: (elementId: string) => void;
  onTranslateAnalysis: (elementId: string) => void;
  isTranslating: boolean;
}

type Interaction = {
  type:
    | 'drag'
    | 'resize'
    | 'rotate'
    | 'resize-arrow-start'
    | 'resize-arrow-end';
  startPoint: Point;
  startElement: CanvasElement;
  startAngle?: number;
  center?: Point;
} | null;

const CopyIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-500 hover:text-gray-800"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CopiedIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-green-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ShowIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const HideIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.007 10.007 0 013.774-5.118l-1.54-1.54A12.02 12.02 0 00.458 12c1.274 4.057 5.064 7 9.542 7 .847 0 1.673-.105 2.468-.303l-1.593-1.593z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.121 14.121a3 3 0 11-4.242-4.242 3 3 0 014.242 4.242zM12 12a3 3 0 00-3 3M17.59 5.337a10.03 10.03 0 012.35 6.663c-1.274 4.057-5.064 7-9.542 7-.847 0-1.673-.105-2.468-.303l-1.593-1.593"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

const TranslateIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 5h12M9 3v2m4 13l4-4-4-4M19 17v-2a4 4 0 00-4-4H9.5M15 13H5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClearIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Helper to detect URL links
const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 relative z-10 break-all"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const TransformableElementComponent: React.FC<TransformableElementProps> = ({
  element,
  isSelected,
  isMultiSelect,
  isOutpainting,
  zoom,
  onSelect,
  onUpdate,
  onInteractionEnd,
  onContextMenu,
  onEditDrawing,
  t,
  language,
  analysis,
  isAnalysisVisible,
  isAnalyzing,
  onAnalyzeElement,
  onOptimizeNotePrompt,
  onToggleAnalysisVisibility,
  onClearAnalysis,
  onTranslateAnalysis,
  isTranslating,
}) => {
  const [interaction, setInteraction] = useState<Interaction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const interactionRef = useRef<Interaction>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const touchInteractionRef = useRef<{
    longPressTimeout: number | null;
    didMove: boolean;
    startPoint: Point | null;
    startEvent: React.TouchEvent | null;
  }>({
    longPressTimeout: null,
    didMove: false,
    startPoint: null,
    startEvent: null,
  });
  const latestElementRef = useRef(element);
  const zoomRef = useRef(zoom);
  const onUpdateRef = useRef(onUpdate);
  const onInteractionEndRef = useRef(onInteractionEnd);
  const onEditDrawingRef = useRef(onEditDrawing);
  const isOutpaintingRef = useRef(isOutpainting);

  useEffect(() => {
    if (isSelected) return;

    const timeoutId = window.setTimeout(() => {
      setIsEditing(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isSelected]);

  useEffect(() => {
    latestElementRef.current = element;
    zoomRef.current = zoom;
    onUpdateRef.current = onUpdate;
    onInteractionEndRef.current = onInteractionEnd;
    onEditDrawingRef.current = onEditDrawing;
    isOutpaintingRef.current = isOutpainting;
  }, [element, zoom, onUpdate, onInteractionEnd, onEditDrawing, isOutpainting]);

  const handleCopy = useCallback((textToCopy: string, id: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  }, []);

  const handleInteractionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, type: Interaction['type']) => {
      if (isOutpainting) return;

      e.stopPropagation();

      let clientX, clientY, shiftKey;
      if ('touches' in e) {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
        shiftKey = e.shiftKey;

        touchInteractionRef.current.didMove = false;
        touchInteractionRef.current.startPoint = { x: clientX, y: clientY };
        touchInteractionRef.current.startEvent = e;
        touchInteractionRef.current.longPressTimeout = window.setTimeout(() => {
          if (
            !touchInteractionRef.current.didMove &&
            touchInteractionRef.current.startEvent
          ) {
            onContextMenu(touchInteractionRef.current.startEvent, element.id);
          }
        }, 500);
      } else {
        if (e.button !== 0) return;
        clientX = e.clientX;
        clientY = e.clientY;
        shiftKey = e.shiftKey;
      }

      onSelect(element.id, shiftKey);

      const startPoint = { x: clientX, y: clientY };
      const interactionDetails: Interaction = {
        type,
        startPoint,
        startElement: element,
      };

      if (type === 'rotate' && elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        interactionDetails.center = { x: centerX, y: centerY };
        interactionDetails.startAngle = Math.atan2(
          startPoint.y - centerY,
          startPoint.x - centerX,
        );
      }

      interactionRef.current = interactionDetails;
      setInteraction(interactionDetails);
    },
    [element, onSelect, isOutpainting, onContextMenu],
  );

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    const currentInteraction = interactionRef.current;
    if (!currentInteraction) return;

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;

      if (
        touchInteractionRef.current.startPoint &&
        !touchInteractionRef.current.didMove
      ) {
        const dist = Math.hypot(
          clientX - touchInteractionRef.current.startPoint.x,
          clientY - touchInteractionRef.current.startPoint.y,
        );
        if (dist > 5) {
          touchInteractionRef.current.didMove = true;
          if (touchInteractionRef.current.longPressTimeout) {
            clearTimeout(touchInteractionRef.current.longPressTimeout);
          }
        }
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const { type, startPoint, startElement } = currentInteraction;
    const dx = (clientX - startPoint.x) / zoomRef.current;
    const dy = (clientY - startPoint.y) / zoomRef.current;

    if (type === 'drag') {
      const newPosition = {
        x: startElement.position.x + dx,
        y: startElement.position.y + dy,
      };
      const delta = { x: dx, y: dy };

      let updatedElement: CanvasElement;

      if (startElement.type === 'arrow') {
        updatedElement = {
          ...startElement,
          position: newPosition,
          start: {
            x: startElement.start.x + dx,
            y: startElement.start.y + dy,
          },
          end: { x: startElement.end.x + dx, y: startElement.end.y + dy },
        };
      } else {
        updatedElement = { ...startElement, position: newPosition };
      }

      onUpdateRef.current(updatedElement, {
        interactionType: type,
        dragDelta: delta,
      });
    } else if (type === 'resize') {
      const rad = startElement.rotation * (Math.PI / 180);
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const rotDx = dx * cos - dy * sin;
      const rotDy = dx * sin + dy * cos;

      let newWidth: number;
      let newHeight: number;

      if (startElement.type === 'image') {
        const widthChangeRatio =
          (startElement.width + rotDx) / startElement.width;
        const heightChangeRatio =
          (startElement.height + rotDy) / startElement.height;
        const avgRatio = (widthChangeRatio + heightChangeRatio) / 2;

        const widthRatioToMin = 20 / startElement.width;
        const heightRatioToMin = 20 / startElement.height;
        const minAllowedRatio = Math.max(widthRatioToMin, heightRatioToMin);

        const finalRatio = Math.max(avgRatio, minAllowedRatio);

        newWidth = startElement.width * finalRatio;
        newHeight = startElement.height * finalRatio;
      } else {
        newWidth = Math.max(20, startElement.width + rotDx);
        newHeight = Math.max(20, startElement.height + rotDy);
      }

      const dw = newWidth - startElement.width;
      const dh = newHeight - startElement.height;
      const posDx = (dw / 2) * Math.cos(rad) - (dh / 2) * Math.sin(rad);
      const posDy = (dw / 2) * Math.sin(rad) + (dh / 2) * Math.cos(rad);

      onUpdateRef.current(
        {
          ...startElement,
          width: newWidth,
          height: newHeight,
          position: {
            x: startElement.position.x + posDx,
            y: startElement.position.y + posDy,
          },
        },
        { interactionType: type },
      );
    } else if (
      type === 'rotate' &&
      currentInteraction.center &&
      currentInteraction.startAngle !== undefined
    ) {
      const { center, startAngle } = currentInteraction;
      const currentAngle = Math.atan2(clientY - center.y, clientX - center.x);
      const angleDiff = currentAngle - startAngle;
      onUpdateRef.current(
        {
          ...startElement,
          rotation: startElement.rotation + angleDiff * (180 / Math.PI),
        },
        { interactionType: type },
      );
    } else if (type === 'resize-arrow-start' || type === 'resize-arrow-end') {
      const arrowElement = startElement as ArrowElement;
      let { start, end } = arrowElement;

      if (type === 'resize-arrow-start') {
        start = {
          x: arrowElement.start.x + dx,
          y: arrowElement.start.y + dy,
        };
      } else {
        end = { x: arrowElement.end.x + dx, y: arrowElement.end.y + dy };
      }

      const newDx = end.x - start.x;
      const newDy = end.y - start.y;

      const newWidth = Math.max(10, Math.sqrt(newDx * newDx + newDy * newDy));
      const newRotation = Math.atan2(newDy, newDx) * (180 / Math.PI);
      const newPosition = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };

      onUpdateRef.current(
        {
          ...arrowElement,
          start,
          end,
          position: newPosition,
          width: newWidth,
          rotation: newRotation,
        },
        { interactionType: type },
      );
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    const currentInteraction = interactionRef.current;
    if (touchInteractionRef.current.longPressTimeout) {
      clearTimeout(touchInteractionRef.current.longPressTimeout);
    }

    // Check for tap-to-edit on touch devices
    if (
      touchInteractionRef.current.startEvent &&
      !touchInteractionRef.current.didMove &&
      !isOutpaintingRef.current
    ) {
      const currentElement = latestElementRef.current;
      if (currentElement.type === 'note') {
        setIsEditing(true);
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.select();
        }, 0);
      } else if (currentElement.type === 'drawing') {
        onEditDrawingRef.current(currentElement.id);
      }
    }

    if (currentInteraction) {
      onInteractionEndRef.current();
    }
    interactionRef.current = null;
    setInteraction(null);
    touchInteractionRef.current.startEvent = null;
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isOutpainting) return;
      if (element.type === 'note') {
        e.stopPropagation();
        setIsEditing(true);
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.select();
        }, 0);
      } else if (element.type === 'drawing') {
        e.stopPropagation();
        onEditDrawing(element.id);
      }
    },
    [element, onEditDrawing, isOutpainting],
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, element.id);
  };

  useEffect(() => {
    if (!interaction) return;

    const handleWindowMove = (event: MouseEvent | TouchEvent) => {
      handleInteractionMove(event);
    };
    const handleWindowEnd = () => {
      handleInteractionEnd();
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowEnd);
    window.addEventListener('touchmove', handleWindowMove, {
      passive: false,
    });
    window.addEventListener('touchend', handleWindowEnd);
    window.addEventListener('touchcancel', handleWindowEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowEnd);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowEnd);
      window.removeEventListener('touchcancel', handleWindowEnd);
    };
  }, [interaction, handleInteractionMove, handleInteractionEnd]);

  const isVisible = isAnalysisVisible;
  const contentToDisplay =
    language === 'zh' && analysis?.zh ? analysis.zh : analysis?.en;
  const isNote = element.type === 'note';

  return (
    <div
      data-testid={`element-${element.id}`}
      ref={elementRef}
      className="absolute"
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.width,
        height: element.height,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        cursor: isOutpainting
          ? 'default'
          : interaction?.type === 'drag'
            ? 'grabbing'
            : 'move',
        zIndex: element.zIndex,
        touchAction: 'none',
      }}
      onMouseDown={(e) => handleInteractionStart(e, 'drag')}
      onTouchStart={(e) => handleInteractionStart(e, 'drag')}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="element-body w-full h-full">
        {(() => {
          const el = element;
          const style: React.CSSProperties = {
            width: '100%',
            height: '100%',
          };

          switch (el.type) {
            case 'note': {
              const alignmentClass =
                el.textAlign === 'center' ? 'text-center' : 'text-left';
              return (
                <div
                  style={style}
                  className={`rounded-lg shadow-md text-white font-medium flex items-center justify-center ${el.color}`}
                >
                  {isEditing ? (
                    <textarea
                      ref={textareaRef}
                      value={el.content}
                      readOnly={!isEditing}
                      onChange={(e) =>
                        onUpdate({ ...el, content: e.target.value })
                      }
                      onBlur={() => setIsEditing(false)}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        onSelect(element.id, e.shiftKey);
                        if (isEditing) {
                          e.stopPropagation();
                        }
                      }}
                      className={`w-full h-full bg-transparent text-white p-4 resize-none border-none focus:outline-none placeholder-gray-200/70 ${isEditing ? 'cursor-text' : 'cursor-move'} ${alignmentClass}`}
                      style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                      placeholder={t('write')}
                    />
                  ) : (
                    <div
                      className={`w-full h-full p-4 overflow-hidden whitespace-pre-wrap break-words ${alignmentClass}`}
                      style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                    >
                      {el.content ? (
                        formatTextWithLinks(el.content)
                      ) : (
                        <span className="text-gray-200/70">{t('write')}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            case 'image':
              return (
                <img
                  src={el.src}
                  alt="User upload"
                  style={style}
                  className="shadow-lg rounded-md object-cover"
                  draggable="false"
                />
              );
            case 'drawing':
              return (
                <div
                  style={style}
                  className="bg-white shadow-md rounded-lg flex items-center justify-center border border-gray-200"
                >
                  {el.src ? (
                    <img
                      src={el.src}
                      alt="User drawing"
                      style={style}
                      className="rounded-lg object-contain"
                      draggable="false"
                    />
                  ) : (
                    <span className="text-gray-400 p-2 text-center">
                      {t('doubleClickToDraw')}
                    </span>
                  )}
                </div>
              );
            case 'iframe':
              return (
                <div
                  style={style}
                  className="shadow-lg rounded-md bg-gray-200 flex flex-col overflow-hidden"
                >
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleInteractionStart(e, 'drag');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleInteractionStart(e, 'drag');
                    }}
                    className="bg-gray-700 text-white py-1 px-2 rounded-t-md flex items-center gap-2 text-xs cursor-move flex-shrink-0"
                  >
                    <span className="truncate flex-grow">{el.url}</span>
                    <button
                      title={`AI Source: ${el.sourceMode}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({
                          ...el,
                          sourceMode:
                            el.sourceMode === 'viewport'
                              ? 'fullpage'
                              : 'viewport',
                        });
                      }}
                      className="p-1 rounded hover:bg-gray-600 flex items-center justify-center"
                    >
                      {el.sourceMode === 'viewport' ? 'Viewport' : 'Fullpage'}
                    </button>
                    <button
                      title={
                        el.isActivated ? 'Deactivate for AI' : 'Activate for AI'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...el, isActivated: !el.isActivated });
                      }}
                      className={`p-1 rounded transition-colors ${el.isActivated ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-400'}`}
                    >
                      AI
                    </button>
                  </div>
                  <div className="w-full h-full flex-grow bg-white">
                    <iframe
                      src={el.url}
                      className="w-full h-full border-none"
                      style={{ pointerEvents: interaction ? 'none' : 'auto' }}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      title="Embedded Web Page"
                    />
                  </div>
                </div>
              );
            case 'arrow': {
              // The SVG viewBox should be independent of the element's width/height to maintain aspect ratio
              const viewBoxWidth = 150;
              const viewBoxHeight = 30;
              return (
                <div
                  style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className={el.color}
                >
                  <svg
                    width="100%"
                    height={viewBoxHeight}
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d={`M0 ${viewBoxHeight / 2} H${viewBoxWidth - 10}`}
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      d={`M${viewBoxWidth - 20} ${viewBoxHeight / 2 - 10} L${viewBoxWidth - 5} ${viewBoxHeight / 2} L${viewBoxWidth - 20} ${viewBoxHeight / 2 + 10}`}
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                </div>
              );
            }
            default:
              return null;
          }
        })()}
      </div>

      {isSelected && !isOutpainting && !isMultiSelect && (
        <>
          <div className="absolute -inset-1 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none" />

          {element.type === 'arrow' ? (
            <>
              <div
                className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab transform-handle"
                onMouseDown={(e) =>
                  handleInteractionStart(e, 'resize-arrow-start')
                }
                onTouchStart={(e) =>
                  handleInteractionStart(e, 'resize-arrow-start')
                }
              />
              <div
                className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab transform-handle"
                onMouseDown={(e) =>
                  handleInteractionStart(e, 'resize-arrow-end')
                }
                onTouchStart={(e) =>
                  handleInteractionStart(e, 'resize-arrow-end')
                }
              />
            </>
          ) : (
            <>
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full cursor-alias transform-handle"
                onMouseDown={(e) => handleInteractionStart(e, 'rotate')}
                onTouchStart={(e) => handleInteractionStart(e, 'rotate')}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-blue-500 pointer-events-none" />

              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize transform-handle"
                onMouseDown={(e) => handleInteractionStart(e, 'resize')}
                onTouchStart={(e) => handleInteractionStart(e, 'resize')}
              />
            </>
          )}
        </>
      )}

      {isSelected &&
        !isMultiSelect &&
        (element.type === 'image' || element.type === 'drawing' || isNote) && (
          <div
            className="analysis-controls absolute top-full left-1/2 mt-2 w-full max-w-sm p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 text-sm text-gray-800"
            style={{
              transform: `translateX(-50%) rotate(${-element.rotation}deg) scale(${1 / zoom})`,
              transformOrigin: 'top center',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  isNote
                    ? onOptimizeNotePrompt(element.id)
                    : onAnalyzeElement(element.id)
                }
                disabled={
                  isAnalyzing ||
                  (isNote && !element.content.trim()) ||
                  ((element.type === 'image' || element.type === 'drawing') &&
                    !element.src)
                }
                className="flex-grow px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:bg-indigo-400 disabled:cursor-wait"
              >
                {isAnalyzing
                  ? isNote
                    ? t('optimizing')
                    : t('analyzing')
                  : isNote
                    ? t('optimizePrompt')
                    : t('analyzeDraft')}
              </button>
              {analysis && (
                <div className="flex items-center gap-1">
                  <button
                    title={isVisible ? t('hide') : t('show')}
                    onClick={() => onToggleAnalysisVisibility(element.id)}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {isVisible ? <HideIcon /> : <ShowIcon />}
                  </button>
                  <button
                    title={t('translate')}
                    onClick={() => onTranslateAnalysis(element.id)}
                    disabled={isTranslating || !!analysis?.zh}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? <SpinnerIcon /> : <TranslateIcon />}
                  </button>
                  <button
                    title={t('clear')}
                    onClick={() => onClearAnalysis(element.id)}
                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                  >
                    <ClearIcon />
                  </button>
                </div>
              )}
            </div>
            {analysis && isVisible && contentToDisplay && (
              <div className="mt-3 space-y-3 text-left">
                <div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-700">
                      {isNote ? t('optimizedPrompt') : t('contentDescription')}
                    </h4>
                    <button
                      onClick={() =>
                        handleCopy(contentToDisplay.description, 'desc')
                      }
                      className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                      title={t('copy')}
                    >
                      {copiedId === 'desc' ? <CopiedIcon /> : <CopyIcon />}
                    </button>
                  </div>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {contentToDisplay.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">
                    {isNote ? t('variations') : t('styleSuggestions')}
                  </h4>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    {contentToDisplay.suggestions.map((s, i) => {
                      const suggestionText =
                        typeof s === 'string'
                          ? s
                          : s.title && s.idea
                            ? `${s.title}: ${s.idea}`
                            : JSON.stringify(s);
                      return (
                        <li
                          key={i}
                          className="flex justify-between items-start gap-2"
                        >
                          <span className="flex-grow py-1">
                            - {suggestionText}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(suggestionText, `sugg-${i}`)
                            }
                            className="p-1 rounded-md hover:bg-gray-200 transition-colors flex-shrink-0"
                            title={t('copy')}
                          >
                            {copiedId === `sugg-${i}` ? (
                              <CopiedIcon />
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export const TransformableElement = memo(TransformableElementComponent);
