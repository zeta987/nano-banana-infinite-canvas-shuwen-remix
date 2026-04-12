import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageElement, Point } from '../types';

interface CropModalProps {
  element: ImageElement;
  onSave: (
    elementId: string,
    dataUrl: string,
    newWidth: number,
    newHeight: number,
  ) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const CropModal: React.FC<CropModalProps> = ({
  element,
  onSave,
  onClose,
  t,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  }); // Percentages
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null means Free
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef<string | null>(null);
  const startPos = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleImgLoad = () => {
    setImgLoaded(true);
    // Initialize with Free aspect
    setAspectRatio(null);
  };

  const applyAspectRatio = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio === null || !imgRef.current) return;

    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;
    const imageRatio = imgWidth / imgHeight;

    // Calculate target dimensions in percentages
    // Target visual ratio: ratio
    // Visual W / Visual H = ratio
    // (w_pct * imgW) / (h_pct * imgH) = ratio
    // w_pct / h_pct = ratio * (imgH / imgW) = ratio / imageRatio

    const targetPercentRatio = ratio / imageRatio;

    let newWidth = cropRect.width;
    let newHeight = newWidth / targetPercentRatio;

    if (newHeight > 100) {
      newHeight = 80; // Reset to reasonable default if it overflows heavily
      newWidth = newHeight * targetPercentRatio;
    }

    // Center the new rect
    let newX = cropRect.x + (cropRect.width - newWidth) / 2;
    let newY = cropRect.y + (cropRect.height - newHeight) / 2;

    // Clamp to bounds
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newWidth > 100) newX = 100 - newWidth;
    if (newY + newHeight > 100) newY = 100 - newHeight;

    setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    type: string,
  ) => {
    e.stopPropagation();
    const pos = 'touches' in e ? e.touches[0] : e;
    isDragging.current = type;
    startPos.current = { x: pos.clientX, y: pos.clientY };
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const pos = 'touches' in e ? e.touches[0] : e;

      // Calculate movement in percentages relative to container
      const dx =
        ((pos.clientX - startPos.current.x) / containerSize.width) * 100;
      const dy =
        ((pos.clientY - startPos.current.y) / containerSize.height) * 100;

      setCropRect((prev) => {
        let { x, y, width, height } = prev;
        const minSize = 5;

        if (isDragging.current === 'move') {
          x = Math.max(0, Math.min(100 - width, x + dx));
          y = Math.max(0, Math.min(100 - height, y + dy));
        } else {
          // Resizing logic
          let newX = x;
          let newY = y;
          let newWidth = width;
          let newHeight = height;

          // Apply raw changes first based on handle
          if (isDragging.current === 'nw') {
            newWidth = width - dx;
            newHeight = height - dy;
            newX = x + dx;
            newY = y + dy;
          } else if (isDragging.current === 'ne') {
            newWidth = width + dx;
            newHeight = height - dy;
            newY = y + dy;
          } else if (isDragging.current === 'sw') {
            newWidth = width - dx;
            newHeight = height + dy;
            newX = x + dx;
          } else if (isDragging.current === 'se') {
            newWidth = width + dx;
            newHeight = height + dy;
          } else if (isDragging.current === 'n') {
            newHeight = height - dy;
            newY = y + dy;
          } else if (isDragging.current === 's') {
            newHeight = height + dy;
          } else if (isDragging.current === 'w') {
            newWidth = width - dx;
            newX = x + dx;
          } else if (isDragging.current === 'e') {
            newWidth = width + dx;
          }

          // Apply aspect ratio constraints if set
          if (aspectRatio !== null && imgRef.current) {
            const imageRatio =
              imgRef.current.naturalWidth / imgRef.current.naturalHeight;
            const targetPercentRatio = aspectRatio / imageRatio;

            // Corner dragging logic
            if (isDragging.current === 'se' || isDragging.current === 'sw') {
              newHeight = newWidth / targetPercentRatio;
            } else if (
              isDragging.current === 'ne' ||
              isDragging.current === 'nw'
            ) {
              const oldBottom = y + height;
              newHeight = newWidth / targetPercentRatio;
              newY = oldBottom - newHeight;
            }
            // Midpoint dragging logic (Center resizing for symmetry)
            else if (isDragging.current === 'n' || isDragging.current === 's') {
              // Height changed, calculate width based on ratio
              const oldCenterX = x + width / 2;
              newWidth = newHeight * targetPercentRatio;
              newX = oldCenterX - newWidth / 2;
            } else if (
              isDragging.current === 'e' ||
              isDragging.current === 'w'
            ) {
              // Width changed, calculate height based on ratio
              const oldCenterY = y + height / 2;
              newHeight = newWidth / targetPercentRatio;
              newY = oldCenterY - newHeight / 2;
            }
          }

          // Check boundaries and min size
          // 1. Min size check
          if (newWidth < minSize) {
            newWidth = minSize;
            if (
              isDragging.current === 'nw' ||
              isDragging.current === 'sw' ||
              isDragging.current === 'w'
            )
              newX = x + width - minSize;
            if (
              isDragging.current === 'n' ||
              isDragging.current === 's' ||
              isDragging.current === 'e' ||
              isDragging.current === 'w'
            ) {
              // If it was a midpoint drag and hit min size, re-center logic might need correction, but simpler to just clamp width
              if (
                aspectRatio !== null &&
                (isDragging.current === 'n' || isDragging.current === 's')
              ) {
                newX = x + (width - newWidth) / 2;
              }
            }

            if (aspectRatio !== null && imgRef.current) {
              const imageRatio =
                imgRef.current.naturalWidth / imgRef.current.naturalHeight;
              newHeight = newWidth / (aspectRatio / imageRatio);
              if (isDragging.current === 'nw' || isDragging.current === 'ne')
                newY = y + height - newHeight;
              if (isDragging.current === 'e' || isDragging.current === 'w') {
                newY = y + (height - newHeight) / 2;
              }
            }
          }
          if (newHeight < minSize) {
            newHeight = minSize;
            if (
              isDragging.current === 'nw' ||
              isDragging.current === 'ne' ||
              isDragging.current === 'n'
            )
              newY = y + height - minSize;

            if (aspectRatio !== null && imgRef.current) {
              // If height was constrained, update width
              const imageRatio =
                imgRef.current.naturalWidth / imgRef.current.naturalHeight;
              newWidth = newHeight * (aspectRatio / imageRatio);
              if (isDragging.current === 'nw' || isDragging.current === 'sw')
                newX = x + width - newWidth;
              if (isDragging.current === 'n' || isDragging.current === 's') {
                newX = x + (width - newWidth) / 2;
              }
            }
          }

          // 2. Boundary Check (0-100)
          // Basic clamping
          if (newX < 0) {
            if (aspectRatio === null) {
              newWidth += newX;
              newX = 0;
            } else {
              // With aspect ratio, hitting left wall means we stop or shrink width without breaking ratio
              // Simplest is to hard stop translation
              newX = 0;
            }
          }
          if (newY < 0) {
            if (aspectRatio === null) {
              newHeight += newY;
              newY = 0;
            } else {
              newY = 0;
            }
          }

          if (newX + newWidth > 100) {
            if (aspectRatio === null) {
              newWidth = 100 - newX;
            } else {
              // Clamp width
            }
          }
          if (newY + newHeight > 100) {
            if (aspectRatio === null) {
              newHeight = 100 - newY;
            } else {
              // Clamp height
            }
          }

          // Final sanity check for display
          if (newX < 0) newX = 0;
          if (newY < 0) newY = 0;
          if (newX + newWidth > 100) newWidth = 100 - newX;
          if (newY + newHeight > 100) newHeight = 100 - newY;

          width = newWidth;
          height = newHeight;
          x = newX;
          y = newY;
        }

        startPos.current = { x: pos.clientX, y: pos.clientY };
        return { x, y, width, height };
      });
    },
    [containerSize, aspectRatio],
  );

  const handleEnd = useCallback(() => {
    isDragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const handleSave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = (cropRect.x / 100) * img.naturalWidth;
    const sourceY = (cropRect.y / 100) * img.naturalHeight;
    const sourceWidth = (cropRect.width / 100) * img.naturalWidth;
    const sourceHeight = (cropRect.height / 100) * img.naturalHeight;

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );

    const croppedDataUrl = canvas.toDataURL('image/png');
    // Maintain scale: Calculate new display size based on the crop ratio
    const newWidth = element.width * (cropRect.width / 100);
    const newHeight = element.height * (cropRect.height / 100);

    onSave(element.id, croppedDataUrl, newWidth, newHeight);
  };

  const Ratios = [
    { label: t('free'), value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center bg-[#0F172A] text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t('cropImage')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-grow bg-black relative p-8 flex items-center justify-center overflow-hidden min-h-[300px]">
          <div ref={containerRef} className="relative inline-block shadow-2xl">
            <img
              ref={imgRef}
              src={element.src}
              alt="To Crop"
              className="max-w-full max-h-[60vh] block select-none pointer-events-none"
              onLoad={handleImgLoad}
            />
            {imgLoaded && (
              <>
                {/* Dimmed Overlay */}
                <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

                {/* Crop Area */}
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move"
                  style={{
                    left: `${cropRect.x}%`,
                    top: `${cropRect.y}%`,
                    width: `${cropRect.width}%`,
                    height: `${cropRect.height}%`,
                  }}
                  onMouseDown={(e) => handleStart(e, 'move')}
                  onTouchStart={(e) => handleStart(e, 'move')}
                >
                  {/* Corner Handles */}
                  <div
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-nw-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'nw')}
                    onTouchStart={(e) => handleStart(e, 'nw')}
                  ></div>
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-ne-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'ne')}
                    onTouchStart={(e) => handleStart(e, 'ne')}
                  ></div>
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-sw-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'sw')}
                    onTouchStart={(e) => handleStart(e, 'sw')}
                  ></div>
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-se-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'se')}
                    onTouchStart={(e) => handleStart(e, 'se')}
                  ></div>

                  {/* Midpoint Handles */}
                  <div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-n-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'n')}
                    onTouchStart={(e) => handleStart(e, 'n')}
                  ></div>
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-s-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 's')}
                    onTouchStart={(e) => handleStart(e, 's')}
                  ></div>
                  <div
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-w-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'w')}
                    onTouchStart={(e) => handleStart(e, 'w')}
                  ></div>
                  <div
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-e-resize shadow-sm z-20"
                    onMouseDown={(e) => handleStart(e, 'e')}
                    onTouchStart={(e) => handleStart(e, 'e')}
                  ></div>

                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-white/80"></div>
                    <div className="border-r border-white/80"></div>
                    <div></div>
                    <div className="border-t border-white/80 col-span-3"></div>
                    <div className="border-t border-white/80 col-span-3"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#0F172A] flex justify-between items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
            {Ratios.map((r) => (
              <button
                key={r.label}
                onClick={() => applyAspectRatio(r.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${aspectRatio === r.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('saveCrop')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
