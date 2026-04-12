import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CanvasElement, Point } from '../types';
import type { ViewportData } from './InfiniteCanvas';
import type { UsageStats } from '../App';

interface MinimapProps {
  elements: CanvasElement[];
  viewport: ViewportData;
  onPanTo: (worldPoint: Point) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  usageStats: UsageStats;
  t: (key: string) => string;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const MINIMAP_ZOOM_FACTOR = 0.05; // 小地圖相對於主畫布的縮放比例

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  viewport,
  onPanTo,
  onZoomIn,
  onZoomOut,
  usageStats,
  t,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const [dragStartViewport, setDragStartViewport] =
    useState<ViewportData | null>(null);

  const getMinimapTransform = useCallback((vp: ViewportData) => {
    const minimapScale = vp.zoom * MINIMAP_ZOOM_FACTOR;
    const viewportCenterX = vp.x + vp.width / 2;
    const viewportCenterY = vp.y + vp.height / 2;

    const worldToMinimap = (p: Point): Point => ({
      x: (p.x - viewportCenterX) * minimapScale + MINIMAP_WIDTH / 2,
      y: (p.y - viewportCenterY) * minimapScale + MINIMAP_HEIGHT / 2,
    });

    const minimapToWorld = (p: Point): Point => ({
      x: (p.x - MINIMAP_WIDTH / 2) / minimapScale + viewportCenterX,
      y: (p.y - MINIMAP_HEIGHT / 2) / minimapScale + viewportCenterY,
    });

    return { minimapScale, worldToMinimap, minimapToWorld };
  }, []);

  const displayViewport = dragStartViewport || viewport;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCollapsed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use displayViewport for drawing the objects so they appear static during drag.
    const {
      minimapScale: displayMinimapScale,
      worldToMinimap: displayWorldToMinimap,
    } = getMinimapTransform(displayViewport);

    // --- Drawing ---
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw elements
    ctx.fillStyle = '#9CA3AF'; // gray-400
    elements.forEach((el) => {
      const mmPos = displayWorldToMinimap(el.position);
      const mmWidth = Math.max(1, el.width * displayMinimapScale);
      const mmHeight = Math.max(1, el.height * displayMinimapScale);

      // Culling to improve performance
      if (
        mmPos.x + mmWidth / 2 < 0 ||
        mmPos.x - mmWidth / 2 > MINIMAP_WIDTH ||
        mmPos.y + mmHeight / 2 < 0 ||
        mmPos.y - mmHeight / 2 > MINIMAP_HEIGHT
      ) {
        return;
      }

      ctx.fillRect(
        mmPos.x - mmWidth / 2,
        mmPos.y - mmHeight / 2,
        mmWidth,
        mmHeight,
      );
    });

    // Draw the LIVE viewport rectangle. It must move.
    // We use the same frozen transform to place it on the frozen map background.
    const vpPos = displayWorldToMinimap({ x: viewport.x, y: viewport.y });
    const vpWidth = viewport.width * displayMinimapScale;
    const vpHeight = viewport.height * displayMinimapScale;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 1;
    ctx.fillRect(vpPos.x, vpPos.y, vpWidth, vpHeight);
    ctx.strokeRect(vpPos.x, vpPos.y, vpWidth, vpHeight);
  }, [elements, viewport, isCollapsed, getMinimapTransform, displayViewport]);

  const handleInteraction = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Use the frozen viewport (from drag start) to calculate world coordinates from the static map view.
      const { minimapToWorld } = getMinimapTransform(
        dragStartViewport || viewport,
      );

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const worldPoint = minimapToWorld({ x, y });
      onPanTo(worldPoint);
    },
    [getMinimapTransform, onPanTo, dragStartViewport, viewport],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setDragStartViewport(viewport); // Freeze viewport for drawing
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setDragStartViewport(null); // Unfreeze
  };

  return (
    <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-1.5 flex items-center gap-3 text-xs font-semibold text-gray-600">
        <div className="flex items-center gap-1" title={t('stats_images')}>
          <span className="text-sm">🖼️</span>
          <span>{usageStats.generatedImages}</span>
        </div>
        <div className="w-px h-3 bg-gray-300"></div>
        <div className="flex items-center gap-1" title={t('stats_ai_ops')}>
          <span className="text-sm">🪄</span>
          <span>{usageStats.aiOperations}</span>
        </div>
      </div>

      <div
        className={`pointer-events-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-auto' : 'w-[200px]'}`}
      >
        <div className="flex items-center justify-between p-1">
          <button
            onClick={onZoomOut}
            className="p-1 rounded hover:bg-gray-200 text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H4"
              />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700 w-10 text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 rounded hover:bg-gray-200 text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-200 text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-screen'}`}
        >
          <canvas
            ref={canvasRef}
            width={MINIMAP_WIDTH}
            height={MINIMAP_HEIGHT}
            className="cursor-pointer border-t border-gray-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
};
