import { fireEvent, render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { TransformableElement } from '@/components/TransformableElement';
import type { CanvasElement } from '@/types';

const noteElement: CanvasElement = {
  id: 'note-1',
  type: 'note',
  position: { x: 20, y: 30 },
  width: 160,
  height: 120,
  rotation: 0,
  zIndex: 1,
  content: 'hello',
  color: 'bg-blue-600',
};

const createProps = () => ({
  element: noteElement,
  isSelected: true,
  isMultiSelect: false,
  isOutpainting: false,
  zoom: 1,
  onSelect: vi.fn(),
  onUpdate: vi.fn(),
  onInteractionEnd: vi.fn(),
  onContextMenu: vi.fn(),
  onEditDrawing: vi.fn(),
  t: (key: string) => key,
  language: 'en' as const,
  analysis: undefined,
  isAnalysisVisible: false,
  isAnalyzing: false,
  onAnalyzeElement: vi.fn(),
  onOptimizeNotePrompt: vi.fn(),
  onToggleAnalysisVisibility: vi.fn(),
  onClearAnalysis: vi.fn(),
  onTranslateAnalysis: vi.fn(),
  isTranslating: false,
});

const countCalls = (spy: ReturnType<typeof vi.spyOn>, eventName: string) =>
  spy.mock.calls.filter(([type]) => type === eventName).length;

describe('TransformableElement listener lifecycle', () => {
  it('keeps drag listeners attached across preview rerenders', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const props = createProps();

    const { getByTestId, rerender } = render(
      <TransformableElement {...props} />,
    );

    fireEvent.mouseDown(getByTestId('element-note-1'), {
      button: 0,
      clientX: 30,
      clientY: 40,
    });

    await waitFor(() => {
      expect(countCalls(addSpy, 'mousemove')).toBe(1);
      expect(countCalls(addSpy, 'mouseup')).toBe(1);
    });

    rerender(
      <TransformableElement
        {...props}
        element={{
          ...noteElement,
          position: { x: 80, y: 110 },
        }}
      />,
    );

    expect(countCalls(addSpy, 'mousemove')).toBe(1);
    expect(countCalls(removeSpy, 'mousemove')).toBe(0);

    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(countCalls(removeSpy, 'mousemove')).toBe(1);
    });
  });
});
