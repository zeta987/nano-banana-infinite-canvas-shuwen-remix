import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type {
  Point,
  CanvasElement,
  ImageElement,
  AnalysisResult,
} from '../types';
import type { OutpaintingState } from '../App';
import { TransformableElement } from './TransformableElement';

interface OutpaintingFrameProps {
  outpaintingState: OutpaintingState;
  zoom: number;
  onUpdateFrame: (newFrame: {
    position: Point;
    width: number;
    height: number;
  }) => void;
}

const OutpaintingFrame: React.FC<OutpaintingFrameProps> = ({
  outpaintingState,
  zoom,
  onUpdateFrame,
}) => {
  const interactionRef = useRef<{
    type: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    startFrame: OutpaintingState['frame'];
    startPoint: Point;
  } | null>(null);

  const handleInteractionMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!interactionRef.current) return;
      const point = 'touches' in e ? e.touches[0] : e;
      if (!point) return;

      const { type, startFrame, startPoint } = interactionRef.current;
      const dx = (point.clientX - startPoint.x) / zoom;
      const dy = (point.clientY - startPoint.y) / zoom;

      const { position, width, height } = startFrame;
      const newPos = { ...position };
      let newWidth = width;
      let newHeight = height;

      if (type.includes('e')) {
        newWidth = Math.max(outpaintingState.element.width, width + dx);
      }
      if (type.includes('w')) {
        newWidth = Math.max(outpaintingState.element.width, width - dx);
      }
      if (type.includes('s')) {
        newHeight = Math.max(outpaintingState.element.height, height + dy);
      }
      if (type.includes('n')) {
        newHeight = Math.max(outpaintingState.element.height, height - dy);
      }

      const dw = newWidth - width;
      const dh = newHeight - height;

      if (type.includes('e')) newPos.x += dw / 2;
      if (type.includes('w')) newPos.x -= dw / 2;
      if (type.includes('s')) newPos.y += dh / 2;
      if (type.includes('n')) newPos.y -= dh / 2;

      onUpdateFrame({ position: newPos, width: newWidth, height: newHeight });
    },
    [zoom, onUpdateFrame, outpaintingState.element],
  );

  const handleInteractionEnd = useCallback(() => {
    interactionRef.current = null;
    window.removeEventListener('mousemove', handleInteractionMove);
    window.removeEventListener('mouseup', handleInteractionEnd);
    window.removeEventListener('touchmove', handleInteractionMove);
    window.removeEventListener('touchend', handleInteractionEnd);
    window.removeEventListener('touchcancel', handleInteractionEnd);
  }, [handleInteractionMove]);

  const handleInteractionStart = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      type: NonNullable<typeof interactionRef.current>['type'],
    ) => {
      e.stopPropagation();

      const point = 'touches' in e ? e.touches[0] : e;
      if (!point) return;

      interactionRef.current = {
        type,
        startFrame: outpaintingState.frame,
        startPoint: { x: point.clientX, y: point.clientY },
      };

      if ('touches' in e) {
        window.addEventListener('touchmove', handleInteractionMove);
        window.addEventListener('touchend', handleInteractionEnd);
        window.addEventListener('touchcancel', handleInteractionEnd);
      } else {
        window.addEventListener('mousemove', handleInteractionMove);
        window.addEventListener('mouseup', handleInteractionEnd);
      }
    },
    [outpaintingState.frame, handleInteractionMove, handleInteractionEnd],
  );

  const frameStyle: React.CSSProperties = {
    position: 'absolute',
    left: outpaintingState.frame.position.x,
    top: outpaintingState.frame.position.y,
    width: outpaintingState.frame.width,
    height: outpaintingState.frame.height,
    transform: `translate(-50%, -50%)`,
    touchAction: 'none',
  };

  return (
    <>
      <div
        style={frameStyle}
        className="pointer-events-none border-2 border-dashed border-teal-500 bg-teal-500/10"
      ></div>

      {/* Handles */}
      <div style={frameStyle} className="pointer-events-auto">
        {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
          <div
            key={dir}
            onMouseDown={(e) => handleInteractionStart(e, dir as any)}
            onTouchStart={(e) => handleInteractionStart(e, dir as any)}
            className={`absolute w-4 h-4 bg-white border-2 border-teal-500 rounded-sm transform-handle
                            ${dir.includes('n') ? 'top-0 -translate-y-1/2' : ''}
                            ${dir.includes('s') ? 'bottom-0 translate-y-1/2' : ''}
                            ${dir.includes('e') ? 'right-0 translate-x-1/2' : ''}
                            ${dir.includes('w') ? 'left-0 -translate-x-1/2' : ''}
                            ${!dir.includes('n') && !dir.includes('s') ? 'top-1/2 -translate-y-1/2' : ''}
                            ${!dir.includes('e') && !dir.includes('w') ? 'left-1/2 -translate-x-1/2' : ''}
                            cursor-${dir}-resize`}
          />
        ))}
      </div>
    </>
  );
};

export interface ViewportData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

interface InfiniteCanvasProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string | null, shiftKey: boolean) => void;
  onMarqueeSelect: (ids: string[], shiftKey: boolean) => void;
  onUpdateElement: (element: CanvasElement, dragDelta?: Point) => void;
  onUpdateMultipleElements: (
    updates: (Partial<CanvasElement> & { id: string })[],
  ) => void;
  onInteractionEnd: () => void;
  setResetViewCallback: (callback: () => void) => void;
  onGenerate: (selectedElements: CanvasElement[]) => void;
  onContextMenu: (
    e: React.MouseEvent | React.TouchEvent,
    worldPoint: Point,
    elementId: string | null,
  ) => void;
  onEditDrawing: (elementId: string) => void;
  onMouseMove: (worldPoint: Point) => void;
  onViewportChange: (viewport: ViewportData) => void;
  imageStyle: string;
  onSetImageStyle: (style: string) => void;
  imageAspectRatio: string;
  onSetImageAspectRatio: (ratio: string) => void;
  outpaintingState: OutpaintingState | null;
  onUpdateOutpaintingFrame: (newFrame: {
    position: Point;
    width: number;
    height: number;
  }) => void;
  onCancelOutpainting: () => void;
  onOutpaintingGenerate: (prompt: string) => void;
  onAutoPromptGenerate: (state: OutpaintingState) => Promise<string>;
  interactionMode: 'pan' | 'select';
  t: (key: string) => string;
  language: 'en' | 'zh';
  analysisResults: Record<string, AnalysisResult>;
  analyzingElementId: string | null;
  onAnalyzeElement: (elementId: string) => void;
  onOptimizeNotePrompt: (elementId: string) => void;
  analysisVisibility: Record<string, boolean>;
  onToggleAnalysisVisibility: (elementId: string) => void;
  onClearAnalysis: (elementId: string) => void;
  onTranslateAnalysis: (elementId: string) => void;
  translatingElementId: string | null;
  generationModel: 'flash' | 'pro';
  imageSize: '512' | '1K' | '2K' | '4K';
  onSetImageSize: (size: '512' | '1K' | '2K' | '4K') => void;
  generationGoogleSearch: boolean;
  onSetGenerationGoogleSearch: (val: boolean) => void;
  generationImageSearch: boolean;
  onSetGenerationImageSearch: (val: boolean) => void;
  generationThinkingLevel: 'HIGH' | 'LOW';
  onSetGenerationThinkingLevel: (val: 'HIGH' | 'LOW') => void;
  apiProvider: 'builtin' | 'custom_gemini' | 'openai';
  onUrlDrop?: (url: string, position: Point) => void;
}

interface MarqueeRect {
  start: Point;
  end: Point;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CanvasApi {
  screenToWorld: (screenPoint: Point) => Point;
  zoomIn: () => void;
  zoomOut: () => void;
  panTo: (worldPoint: Point) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

type GroupInteraction = {
  type: 'group-resize' | 'group-rotate';
  startPoint: Point;
  startBbox: BoundingBox;
  startElements: CanvasElement[];
  center: Point;
  startAngle?: number;
} | null;

export const InfiniteCanvas = forwardRef<CanvasApi, InfiniteCanvasProps>(
  (
    {
      elements,
      selectedElementIds,
      onSelectElement,
      onMarqueeSelect,
      onUpdateElement,
      onUpdateMultipleElements,
      onInteractionEnd,
      setResetViewCallback,
      onGenerate,
      onContextMenu,
      onEditDrawing,
      onMouseMove,
      onViewportChange,
      imageStyle,
      onSetImageStyle,
      imageAspectRatio,
      onSetImageAspectRatio,
      outpaintingState,
      onUpdateOutpaintingFrame,
      onCancelOutpainting,
      onOutpaintingGenerate,
      onAutoPromptGenerate,
      interactionMode,
      t,
      language,
      analysisResults,
      analyzingElementId,
      onAnalyzeElement,
      onOptimizeNotePrompt,
      analysisVisibility,
      onToggleAnalysisVisibility,
      onClearAnalysis,
      onTranslateAnalysis,
      translatingElementId,
      generationModel,
      imageSize,
      onSetImageSize,
      generationGoogleSearch,
      onSetGenerationGoogleSearch,
      generationImageSearch,
      onSetGenerationImageSearch,
      generationThinkingLevel,
      onSetGenerationThinkingLevel,
      apiProvider,
      onUrlDrop,
    },
    ref,
  ) => {
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState<Point>({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
    const [outpaintingPrompt, setOutpaintingPrompt] = useState('');
    const [isAutoPrompting, setIsAutoPrompting] = useState(false);
    const [groupInteraction, setGroupInteraction] =
      useState<GroupInteraction>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const marqueeRectRef = useRef<MarqueeRect | null>(null);

    const touchStateRef = useRef<{
      lastTouches: React.Touch[] | null;
      startPoint: Point | null;
      didMove: boolean;
      longPressTimeout: number | null;
      isMarquee: boolean;
    }>({
      lastTouches: null,
      startPoint: null,
      didMove: false,
      longPressTimeout: null,
      isMarquee: false,
    });

    const screenToWorld = useCallback(
      (screenPoint: Point): Point => {
        return {
          x: (screenPoint.x - pan.x) / zoom,
          y: (screenPoint.y - pan.y) / zoom,
        };
      },
      [pan, zoom],
    );

    const zoomToPoint = useCallback(
      (newZoom: number, screenPoint: Point) => {
        const worldPoint = screenToWorld(screenPoint);
        const newPan = {
          x: screenPoint.x - worldPoint.x * newZoom,
          y: screenPoint.y - worldPoint.y * newZoom,
        };
        setZoom(newZoom);
        setPan(newPan);
      },
      [screenToWorld],
    );

    const zoomIn = useCallback(() => {
      if (!canvasRef.current) return;
      const centerScreen = {
        x: canvasRef.current.clientWidth / 2,
        y: canvasRef.current.clientHeight / 2,
      };
      zoomToPoint(Math.min(MAX_ZOOM, zoom * 1.2), centerScreen);
    }, [zoom, zoomToPoint]);

    const zoomOut = useCallback(() => {
      if (!canvasRef.current) return;
      const centerScreen = {
        x: canvasRef.current.clientWidth / 2,
        y: canvasRef.current.clientHeight / 2,
      };
      zoomToPoint(Math.max(MIN_ZOOM, zoom / 1.2), centerScreen);
    }, [zoom, zoomToPoint]);

    const panTo = useCallback(
      (worldPoint: Point) => {
        if (!canvasRef.current) return;
        const { clientWidth, clientHeight } = canvasRef.current;
        const newPan = {
          x: -worldPoint.x * zoom + clientWidth / 2,
          y: -worldPoint.y * zoom + clientHeight / 2,
        };
        setPan(newPan);
      },
      [zoom],
    );

    useImperativeHandle(
      ref,
      () => ({
        screenToWorld,
        zoomIn,
        zoomOut,
        panTo,
      }),
      [screenToWorld, zoomIn, zoomOut, panTo],
    );

    useEffect(() => {
      if (outpaintingState) {
        setOutpaintingPrompt('');
      }
    }, [outpaintingState]);

    useEffect(() => {
      if (onViewportChange && canvasRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        const worldTopLeft = screenToWorld({ x: 0, y: 0 });
        const worldBottomRight = screenToWorld({
          x: clientWidth,
          y: clientHeight,
        });
        onViewportChange({
          x: worldTopLeft.x,
          y: worldTopLeft.y,
          width: worldBottomRight.x - worldTopLeft.x,
          height: worldBottomRight.y - worldTopLeft.y,
          zoom: zoom,
        });
      }
    }, [pan, zoom, screenToWorld, onViewportChange]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          const target = e.target as HTMLElement;
          if (
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'INPUT' ||
            target.isContentEditable
          ) {
            return; // Don't prevent default for text inputs
          }
          e.preventDefault();
          setIsSpacebarPressed(true);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          setIsSpacebarPressed(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    const performMarqueeSelection = useCallback(
      (rect: MarqueeRect, shiftKey: boolean) => {
        if (!rect) return;
        const startWorld = screenToWorld(rect.start);
        const endWorld = screenToWorld(rect.end);

        const selectionBox = {
          minX: Math.min(startWorld.x, endWorld.x),
          maxX: Math.max(startWorld.x, endWorld.x),
          minY: Math.min(startWorld.y, endWorld.y),
          maxY: Math.max(startWorld.y, endWorld.y),
        };

        const selectedIds = elements
          .filter(
            (el) =>
              el.position.x >= selectionBox.minX &&
              el.position.x <= selectionBox.maxX &&
              el.position.y >= selectionBox.minY &&
              el.position.y <= selectionBox.maxY,
          )
          .map((el) => el.id);

        if (selectedIds.length > 0) {
          onMarqueeSelect(selectedIds, shiftKey);
        }
        setMarqueeRect(null);
        marqueeRectRef.current = null;
      },
      [screenToWorld, elements, onMarqueeSelect],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const isInteractingWithElement = (e.target as HTMLElement).closest(
          '.transform-handle, .element-body, .generate-controls, .analysis-controls',
        );

        if (e.button === 1 && !isInteractingWithElement) {
          e.preventDefault();
          setIsPanning(true);
          setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          return;
        }

        if (e.button !== 0 || isInteractingWithElement) return;

        if (isSpacebarPressed) {
          e.preventDefault();
          setIsPanning(true);
          setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        } else if (!outpaintingState) {
          onSelectElement(null, e.shiftKey);
          const startPoint = { x: e.clientX, y: e.clientY };
          const newRect = { start: startPoint, end: startPoint };
          setMarqueeRect(newRect);
          marqueeRectRef.current = newRect;
        }
      },
      [isSpacebarPressed, pan, onSelectElement, outpaintingState],
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        setIsPanning(false);
        if (marqueeRectRef.current) {
          performMarqueeSelection(marqueeRectRef.current, e.shiftKey);
        }
        if (groupInteraction) {
          setGroupInteraction(null);
          onInteractionEnd();
        }
      },
      [performMarqueeSelection, groupInteraction, onInteractionEnd],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (onMouseMove) {
          onMouseMove(screenToWorld({ x: e.clientX, y: e.clientY }));
        }

        if (isPanning) {
          setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
        } else if (marqueeRectRef.current) {
          const newRect = {
            ...marqueeRectRef.current,
            end: { x: e.clientX, y: e.clientY },
          };
          setMarqueeRect(newRect);
          marqueeRectRef.current = newRect;
        } else if (groupInteraction) {
          const { type, startPoint, startElements, startBbox, center } =
            groupInteraction;
          const currentPoint = { x: e.clientX, y: e.clientY };

          if (
            type === 'group-rotate' &&
            groupInteraction.startAngle !== undefined
          ) {
            const radPerPixel = 1 / (100 * zoom); // sensitivity
            const currentAngle = Math.atan2(
              currentPoint.y - (startBbox.minY * zoom + pan.y - 16),
              currentPoint.x - (center.x * zoom + pan.x),
            );
            const startAngle = Math.atan2(
              startPoint.y - (startBbox.minY * zoom + pan.y - 16),
              startPoint.x - (center.x * zoom + pan.x),
            );
            const angleDiff = currentAngle - startAngle;

            const updates = startElements.map((el) => {
              const rotatedPosition = {
                x:
                  center.x +
                  (el.position.x - center.x) * Math.cos(angleDiff) -
                  (el.position.y - center.y) * Math.sin(angleDiff),
                y:
                  center.y +
                  (el.position.x - center.x) * Math.sin(angleDiff) +
                  (el.position.y - center.y) * Math.cos(angleDiff),
              };
              return {
                id: el.id,
                position: rotatedPosition,
                rotation: el.rotation + angleDiff * (180 / Math.PI),
              };
            });
            onUpdateMultipleElements(updates);
          } else if (type === 'group-resize') {
            const dx = (currentPoint.x - startPoint.x) / zoom;
            const dy = (currentPoint.y - startPoint.y) / zoom;

            // Maintain aspect ratio
            const originalDiagonal = Math.sqrt(
              startBbox.width ** 2 + startBbox.height ** 2,
            );
            const newDiagonal = Math.sqrt(
              (startBbox.width + dx) ** 2 + (startBbox.height + dy) ** 2,
            );
            const ratio = newDiagonal / originalDiagonal;

            if (isNaN(ratio) || ratio === 0) return;

            const updates = startElements.map((el) => {
              const newWidth = el.width * ratio;
              const newHeight = el.height * ratio;

              const relativePos = {
                x: el.position.x - center.x,
                y: el.position.y - center.y,
              };
              const newRelativePos = {
                x: relativePos.x * ratio,
                y: relativePos.y * ratio,
              };
              const newPosition = {
                x: center.x + newRelativePos.x,
                y: center.y + newRelativePos.y,
              };

              return {
                id: el.id,
                width: newWidth,
                height: newHeight,
                position: newPosition,
              };
            });
            onUpdateMultipleElements(updates);
          }
        }
      },
      [
        isPanning,
        startPan,
        groupInteraction,
        onUpdateMultipleElements,
        zoom,
        pan,
        onMouseMove,
        screenToWorld,
      ],
    );

    const handleWheel = useCallback(
      (e: WheelEvent) => {
        e.preventDefault();
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, zoom * (1 - e.deltaY * 0.001)),
        );

        zoomToPoint(newZoom, { x: mouseX, y: mouseY });
      },
      [zoom, zoomToPoint],
    );

    const handleTouchStart = useCallback(
      (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const isGroupHandle = target.closest('.group-transform-handle');

        if (isGroupHandle) {
          e.preventDefault();
          e.stopPropagation();
          return; // Group handles have their own onTouchStart
        }

        if (
          target.closest(
            '.transform-handle, .element-body, .generate-controls, .analysis-controls',
          )
        ) {
          return;
        }
        e.preventDefault();

        if (touchStateRef.current.longPressTimeout) {
          clearTimeout(touchStateRef.current.longPressTimeout);
        }

        touchStateRef.current.lastTouches = Array.from(e.touches);
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          if (onMouseMove) {
            onMouseMove(screenToWorld({ x: touch.clientX, y: touch.clientY }));
          }

          touchStateRef.current.startPoint = {
            x: touch.clientX,
            y: touch.clientY,
          };
          touchStateRef.current.didMove = false;
          touchStateRef.current.isMarquee = false;

          touchStateRef.current.longPressTimeout = window.setTimeout(() => {
            if (!touchStateRef.current.didMove) {
              const worldPoint = screenToWorld({
                x: touch.clientX,
                y: touch.clientY,
              });
              onContextMenu(e as unknown as React.TouchEvent, worldPoint, null);
            }
          }, 500);
        } else {
          touchStateRef.current.startPoint = null;
        }
      },
      [onContextMenu, screenToWorld, onMouseMove],
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(
            '.transform-handle, .element-body, .generate-controls, .analysis-controls, .group-transform-handle',
          )
        ) {
          return;
        }
        e.preventDefault();

        const { touches } = e;
        const { lastTouches, startPoint } = touchStateRef.current;

        if (touches.length === 1 && startPoint) {
          const touch = touches[0];
          if (onMouseMove) {
            onMouseMove(screenToWorld({ x: touch.clientX, y: touch.clientY }));
          }

          if (!touchStateRef.current.didMove) {
            const dist = Math.hypot(
              touch.clientX - startPoint.x,
              touch.clientY - startPoint.y,
            );
            if (dist > 5) {
              touchStateRef.current.didMove = true;
              if (touchStateRef.current.longPressTimeout) {
                clearTimeout(touchStateRef.current.longPressTimeout);
                touchStateRef.current.longPressTimeout = null;
              }
              if (
                interactionMode === 'select' &&
                !outpaintingState &&
                !marqueeRectRef.current
              ) {
                touchStateRef.current.isMarquee = true;
                onSelectElement(null, false);
                const newRect = {
                  start: startPoint,
                  end: { x: touch.clientX, y: touch.clientY },
                };
                setMarqueeRect(newRect);
                marqueeRectRef.current = newRect;
              }
            }
          }

          if (touchStateRef.current.didMove) {
            if (touchStateRef.current.isMarquee) {
              const newRect = {
                ...marqueeRectRef.current!,
                end: { x: touch.clientX, y: touch.clientY },
              };
              setMarqueeRect(newRect);
              marqueeRectRef.current = newRect;
            } else if (interactionMode === 'pan') {
              if (lastTouches?.length === 1) {
                const lastTouch = lastTouches[0];
                const dx = touch.clientX - lastTouch.clientX;
                const dy = touch.clientY - lastTouch.clientY;
                setPan((prevPan) => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
              }
            }
          }
        } else if (touches.length === 2 && lastTouches?.length === 2) {
          if (touchStateRef.current.longPressTimeout) {
            clearTimeout(touchStateRef.current.longPressTimeout);
          }
          touchStateRef.current.didMove = true;

          const [lastT1, lastT2] = [lastTouches[0], lastTouches[1]];
          const [currT1, currT2] = [touches[0], touches[1]];

          const lastDist = Math.hypot(
            lastT1.clientX - lastT2.clientX,
            lastT1.clientY - lastT2.clientY,
          );
          const currDist = Math.hypot(
            currT1.clientX - currT2.clientX,
            currT1.clientY - currT2.clientY,
          );

          if (lastDist > 0) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const pinchCenterX =
              (currT1.clientX + currT2.clientX) / 2 - rect.left;
            const pinchCenterY =
              (currT1.clientY + currT2.clientY) / 2 - rect.top;

            const newZoom = Math.max(
              MIN_ZOOM,
              Math.min(MAX_ZOOM, zoom * (currDist / lastDist)),
            );

            zoomToPoint(newZoom, { x: pinchCenterX, y: pinchCenterY });
          }
        }

        touchStateRef.current.lastTouches = Array.from(touches);
      },
      [
        pan,
        zoom,
        interactionMode,
        onSelectElement,
        outpaintingState,
        onMouseMove,
        screenToWorld,
        zoomToPoint,
      ],
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(
            '.transform-handle, .element-body, .generate-controls, .analysis-controls, .group-transform-handle',
          )
        ) {
          return;
        }

        if (touchStateRef.current.longPressTimeout) {
          clearTimeout(touchStateRef.current.longPressTimeout);
        }

        if (touchStateRef.current.isMarquee && marqueeRectRef.current) {
          performMarqueeSelection(marqueeRectRef.current, false);
        } else if (
          !touchStateRef.current.didMove &&
          touchStateRef.current.startPoint
        ) {
          onSelectElement(null, false);
        }

        if (groupInteraction) {
          setGroupInteraction(null);
          onInteractionEnd();
        }

        touchStateRef.current.lastTouches =
          e.touches.length > 0 ? Array.from(e.touches) : null;
        touchStateRef.current.startPoint = null;
        touchStateRef.current.didMove = false;
        touchStateRef.current.isMarquee = false;
      },
      [
        onSelectElement,
        performMarqueeSelection,
        groupInteraction,
        onInteractionEnd,
      ],
    );

    const resetView = useCallback(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        setPan({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 });
      } else {
        setPan({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
      setZoom(1);
    }, []);

    useEffect(() => {
      resetView();
    }, [resetView]);

    useEffect(() => {
      setResetViewCallback(resetView);
    }, [resetView, setResetViewCallback]);

    // Register wheel/touch listeners as non-passive so preventDefault() works
    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;
      const opts: AddEventListenerOptions = { passive: false };
      el.addEventListener('wheel', handleWheel, opts);
      el.addEventListener('touchstart', handleTouchStart, opts);
      el.addEventListener('touchmove', handleTouchMove, opts);
      return () => {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
      };
    }, [handleWheel, handleTouchStart, handleTouchMove]);

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

    const selectionBbox = useMemo((): BoundingBox | null => {
      const selectedElements = elements.filter((el) =>
        selectedElementIds.includes(el.id),
      );
      if (selectedElements.length === 0) return null;

      const allCorners = selectedElements.flatMap(getRotatedCorners);
      if (allCorners.length === 0) return null;

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

      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
      };
    }, [elements, selectedElementIds]);

    const handleGroupInteractionStart = useCallback(
      (
        e: React.MouseEvent | React.TouchEvent,
        type: GroupInteraction['type'],
      ) => {
        if (!selectionBbox) return;
        e.preventDefault();
        e.stopPropagation();

        const point = 'touches' in e ? e.touches[0] : e;
        if (!point) return;

        const startPoint = { x: point.clientX, y: point.clientY };
        const center = {
          x: (selectionBbox.minX + selectionBbox.maxX) / 2,
          y: (selectionBbox.minY + selectionBbox.maxY) / 2,
        };
        const startElements = elements.filter((el) =>
          selectedElementIds.includes(el.id),
        );

        const interactionDetails: GroupInteraction = {
          type,
          startPoint,
          startBbox: selectionBbox,
          startElements,
          center,
        };

        if (type === 'group-rotate') {
          const bboxCenterScreen = {
            x: center.x * zoom + pan.x,
            y: center.y * zoom + pan.y,
          };
          interactionDetails.startAngle = Math.atan2(
            startPoint.y - bboxCenterScreen.y,
            startPoint.x - bboxCenterScreen.x,
          );
        }

        setGroupInteraction(interactionDetails);
      },
      [selectionBbox, elements, selectedElementIds, zoom, pan],
    );

    const handleGenerateClick = useCallback(() => {
      const selectedElements = elements.filter((el) =>
        selectedElementIds.includes(el.id),
      );
      if (selectedElements.length > 0) {
        onGenerate(selectedElements);
      }
    }, [elements, selectedElementIds, onGenerate]);

    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    let cursorClass = 'cursor-default';
    if (isPanning) {
      cursorClass = 'cursor-grabbing';
    } else if (isSpacebarPressed) {
      cursorClass = 'cursor-grab';
    } else if (outpaintingState) {
      cursorClass = 'cursor-auto';
    } else if (interactionMode === 'select' && !touchStateRef.current.didMove) {
      cursorClass = 'cursor-crosshair';
    }

    const handleCanvasContextMenu = (e: React.MouseEvent) => {
      const worldPoint = screenToWorld({ x: e.clientX, y: e.clientY });
      onContextMenu(e, worldPoint, null);
    };

    const IMAGE_STYLES = [
      { value: 'Default', label: 'Default (預設)' },
      { value: '8-Bit', label: '8-Bit (8位元)' },
      { value: 'Botanical Art', label: 'Botanical Art (植物藝術)' },
      { value: 'Comic Book', label: 'Comic Book (漫畫)' },
      { value: 'Cubism', label: 'Cubism (立體派)' },
      { value: 'Cyberpunk', label: 'Cyberpunk (賽博龐克)' },
      { value: 'Exploded View', label: 'Exploded View (爆炸圖)' },
      { value: 'Glitch Art', label: 'Glitch Art (故障藝術)' },
      { value: 'Isometric', label: 'Isometric (等距視角)' },
      { value: 'Knolling', label: 'Knolling (平鋪直敘)' },
      { value: 'Low Poly', label: 'Low Poly (低多邊形)' },
      { value: 'Mosaic', label: 'Mosaic (馬賽克)' },
      { value: 'Oil Painting', label: 'Oil Painting (油畫)' },
      { value: 'Pixel Art', label: 'Pixel Art (像素藝術)' },
      { value: 'Playful 3D Art', label: 'Playful 3D Art (趣味3D)' },
      { value: 'Pop Art', label: 'Pop Art (普普藝術)' },
      { value: 'Photorealism', label: 'Photorealism (超寫實)' },
      { value: 'Surrealism', label: 'Surrealism (超現實)' },
      { value: 'Vaporwave', label: 'Vaporwave (蒸氣波)' },
      { value: 'Vector Art', label: 'Vector Art (向量藝術)' },
      { value: 'Watercolor', label: 'Watercolor (水彩)' },
    ];

    const ASPECT_RATIOS = {
      Auto: ['auto'],
      Landscape: ['21:9', '16:9', '4:3', '3:2', '5:4'],
      Square: ['1:1'],
      Portrait: ['9:16', '3:4', '2:3', '4:5'],
    };

    const handleOutpaintingGenerateClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOutpaintingGenerate(outpaintingPrompt);
    };

    const handleOutpaintingCancelClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onCancelOutpainting();
    };

    const handleAutoPromptClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!outpaintingState) return;
      setIsAutoPrompting(true);
      try {
        const prompt = await onAutoPromptGenerate(outpaintingState);
        setOutpaintingPrompt(prompt);
      } catch (error) {
        console.error('Error auto-generating prompt:', error);
        alert('Failed to auto-generate prompt. Please check the console.');
      } finally {
        setIsAutoPrompting(false);
      }
    };

    return (
      <div
        ref={canvasRef}
        className={`w-full h-full overflow-hidden bg-gray-50 
        bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px]
        ${cursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={handleCanvasContextMenu}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const url =
            e.dataTransfer.getData('text/uri-list') ||
            e.dataTransfer.getData('text/plain');
          if (url && onUrlDrop) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const x = (e.clientX - rect.left - pan.x) / zoom;
              const y = (e.clientY - rect.top - pan.y) / zoom;
              onUrlDrop(url, { x, y });
            }
          }
        }}
        style={{ touchAction: 'none' }}
      >
        <div
          className="transform-gpu select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {sortedElements.map((el) => (
            <TransformableElement
              key={el.id}
              element={el}
              zoom={zoom}
              isSelected={selectedElementIds.includes(el.id)}
              isMultiSelect={selectedElementIds.length > 1}
              isOutpainting={outpaintingState?.element.id === el.id}
              onSelect={onSelectElement}
              onUpdate={onUpdateElement}
              onInteractionEnd={onInteractionEnd}
              onContextMenu={(e, elementId) => {
                const point = 'touches' in e ? e.touches[0] : e;
                const worldPoint = screenToWorld({
                  x: point.clientX,
                  y: point.clientY,
                });
                onContextMenu(e, worldPoint, elementId);
              }}
              onEditDrawing={onEditDrawing}
              t={t}
              language={language}
              analysisResults={analysisResults}
              analyzingElementId={analyzingElementId}
              onAnalyzeElement={onAnalyzeElement}
              onOptimizeNotePrompt={onOptimizeNotePrompt}
              analysisVisibility={analysisVisibility}
              onToggleAnalysisVisibility={onToggleAnalysisVisibility}
              onClearAnalysis={onClearAnalysis}
              onTranslateAnalysis={onTranslateAnalysis}
              translatingElementId={translatingElementId}
            />
          ))}
          {selectionBbox && (
            <div className="absolute pointer-events-none">
              <div
                className="border-2 border-blue-500/50 border-dashed"
                style={{
                  position: 'absolute',
                  left: selectionBbox.minX,
                  top: selectionBbox.minY,
                  width: selectionBbox.width,
                  height: selectionBbox.height,
                  transform: `rotate(${selectionBbox.rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
              {selectedElementIds.length > 1 && !outpaintingState && (
                <>
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full cursor-alias group-transform-handle"
                    style={{
                      left: selectionBbox.minX + selectionBbox.width / 2,
                      top: selectionBbox.minY,
                      transform: `translate(-50%, -150%)`,
                    }}
                    onMouseDown={(e) =>
                      handleGroupInteractionStart(e, 'group-rotate')
                    }
                    onTouchStart={(e) =>
                      handleGroupInteractionStart(e, 'group-rotate')
                    }
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-blue-500 pointer-events-none"
                    style={{
                      left: selectionBbox.minX + selectionBbox.width / 2,
                      top: selectionBbox.minY,
                      transform: `translate(-50%, -100%)`,
                    }}
                  />

                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize group-transform-handle"
                    style={{
                      left: selectionBbox.maxX,
                      top: selectionBbox.maxY,
                      transform: `translate(-50%, -50%)`,
                    }}
                    onMouseDown={(e) =>
                      handleGroupInteractionStart(e, 'group-resize')
                    }
                    onTouchStart={(e) =>
                      handleGroupInteractionStart(e, 'group-resize')
                    }
                  />
                </>
              )}
            </div>
          )}
          {outpaintingState && (
            <OutpaintingFrame
              outpaintingState={outpaintingState}
              zoom={zoom}
              onUpdateFrame={onUpdateOutpaintingFrame}
            />
          )}
        </div>

        {outpaintingState && (
          <div
            style={{
              position: 'absolute',
              left: outpaintingState.frame.position.x * zoom + pan.x,
              top:
                (outpaintingState.frame.position.y +
                  outpaintingState.frame.height / 2) *
                  zoom +
                pan.y +
                10,
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
            className="flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 w-64"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-gray-700">
              {t('expandImage')}
            </h3>
            <div className="relative w-full">
              <input
                type="text"
                value={outpaintingPrompt}
                onChange={(e) => setOutpaintingPrompt(e.target.value)}
                placeholder="Describe expansion or auto-prompt"
                className="w-full pl-3 pr-8 py-2 text-sm bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAutoPromptClick}
                disabled={isAutoPrompting}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-wait transition-colors"
                aria-label="Auto-generate prompt"
              >
                {isAutoPrompting ? (
                  <svg
                    className="animate-spin h-4 w-4"
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
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOutpaintingCancelClick}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleOutpaintingGenerateClick}
                className="flex-1 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 whitespace-nowrap"
              >
                {t('generate')} ✨
              </button>
            </div>
          </div>
        )}

        {selectionBbox && !outpaintingState && (
          <div
            className="absolute z-10 generate-controls flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200"
            style={{
              left: selectionBbox.maxX * zoom + pan.x + 10,
              top: selectionBbox.minY * zoom + pan.y,
              minWidth: '180px',
            }}
          >
            <select
              value={imageStyle}
              onChange={(e) => onSetImageStyle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {IMAGE_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>

            <select
              value={imageAspectRatio}
              onChange={(e) => onSetImageAspectRatio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(ASPECT_RATIOS).map(([group, ratios]) => (
                <optgroup label={group} key={group}>
                  {ratios.map((ratio) => (
                    <option key={ratio} value={ratio}>
                      {ratio}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <select
              value={imageSize}
              onChange={(e) => onSetImageSize(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-800 rounded-md border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border-l-4 border-l-purple-500"
              title={t('imageSize')}
            >
              {generationModel === 'flash' && <option value="512">512</option>}
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>

            {apiProvider !== 'openai' && (
              <div className="flex flex-col gap-1 text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generationGoogleSearch}
                    onChange={(e) =>
                      onSetGenerationGoogleSearch(e.target.checked)
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  {t('googleSearch')}
                </label>
                {generationModel === 'flash' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generationImageSearch}
                      onChange={(e) =>
                        onSetGenerationImageSearch(e.target.checked)
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    {t('googleImageSearch') || 'Google Image Search'}
                  </label>
                )}
                {generationModel === 'flash' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">Thinking:</span>
                    <select
                      value={generationThinkingLevel}
                      onChange={(e) =>
                        onSetGenerationThinkingLevel(e.target.value as any)
                      }
                      className="flex-1 px-1 py-0.5 text-xs bg-white text-gray-800 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleGenerateClick}
              className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-wait"
            >
              {t('generate')} ✨
            </button>
            <div className="text-[10px] text-gray-500 leading-tight">
              <span className="font-bold text-gray-600">
                {t('maxRefImages') || 'Max 14 Reference Images:'}
              </span>
              <br />
              {t('flashRefLimit') || 'Flash: 10 objects, 4 characters'}
              <br />
              {t('proRefLimit') || 'Pro: 6 objects, 5 characters'}
            </div>
          </div>
        )}

        {marqueeRect && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
            style={{
              left: Math.min(marqueeRect.start.x, marqueeRect.end.x),
              top: Math.min(marqueeRect.start.y, marqueeRect.end.y),
              width: Math.abs(marqueeRect.start.x - marqueeRect.end.x),
              height: Math.abs(marqueeRect.start.y - marqueeRect.end.y),
            }}
          />
        )}
      </div>
    );
  },
);

InfiniteCanvas.displayName = 'InfiniteCanvas';
