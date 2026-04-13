import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { Minimap } from '@/components/Minimap';
import type { CanvasElement } from '@/types';

const baseViewport = {
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  zoom: 1,
};

const baseUsageStats = {
  generatedImages: 0,
  aiOperations: 0,
};

const createElement = (id: string, x: number): CanvasElement => ({
  id,
  type: 'note',
  position: { x, y: 20 },
  width: 120,
  height: 80,
  rotation: 0,
  zIndex: 1,
  content: id,
  color: 'bg-blue-600',
});

describe('Minimap scheduling', () => {
  it('coalesces redraw work behind animation frames', () => {
    const clearRect = vi.fn();
    const fillRect = vi.fn();
    const strokeRect = vi.fn();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        clearRect,
        fillRect,
        strokeRect,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D);

    let nextFrameId = 0;
    const frameCallbacks = new Map<number, FrameRequestCallback>();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      nextFrameId += 1;
      frameCallbacks.set(nextFrameId, callback);
      return nextFrameId;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
      frameCallbacks.delete(frameId);
    });

    const { rerender } = render(
      <Minimap
        elements={[createElement('a', 20)]}
        viewport={baseViewport}
        onPanTo={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        usageStats={baseUsageStats}
        t={(key) => key}
      />,
    );

    rerender(
      <Minimap
        elements={[createElement('a', 40)]}
        viewport={baseViewport}
        onPanTo={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        usageStats={baseUsageStats}
        t={(key) => key}
      />,
    );

    rerender(
      <Minimap
        elements={[createElement('a', 60)]}
        viewport={baseViewport}
        onPanTo={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        usageStats={baseUsageStats}
        t={(key) => key}
      />,
    );

    expect(clearRect).not.toHaveBeenCalled();

    const pendingFrames = [...frameCallbacks.values()];
    frameCallbacks.clear();
    pendingFrames.forEach((callback) => callback(16));

    expect(clearRect).toHaveBeenCalledTimes(1);
    expect(fillRect).toHaveBeenCalled();
    expect(strokeRect).toHaveBeenCalledTimes(1);

    getContextSpy.mockRestore();
  });
});
