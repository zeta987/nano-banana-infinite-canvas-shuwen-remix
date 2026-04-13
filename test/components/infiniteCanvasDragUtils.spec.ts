import { buildInteractionPreviewElements } from '@/components/infiniteCanvasDragUtils';
import type { CanvasElement } from '@/types';

const createNote = (id: string, x: number, y: number): CanvasElement => ({
  id,
  type: 'note',
  position: { x, y },
  width: 120,
  height: 90,
  rotation: 0,
  zIndex: 1,
  content: id,
  color: 'bg-blue-600',
});

describe('buildInteractionPreviewElements', () => {
  it('snaps single-element drag previews without mutating siblings', () => {
    const elements = [createNote('a', 20, 20), createNote('b', 220, 20)];

    const preview = buildInteractionPreviewElements({
      elements,
      updatedElement: {
        ...elements[0],
        position: { x: 63, y: 67 },
      },
      metadata: {
        interactionType: 'drag',
        dragDelta: { x: 43, y: 47 },
      },
      selectedElementIds: ['a'],
      snapToGrid: true,
    });

    expect(preview).toEqual([
      expect.objectContaining({
        id: 'a',
        position: { x: 60, y: 70 },
      }),
    ]);
  });

  it('builds multi-select drag previews from the original geometry', () => {
    const elements = [createNote('a', 20, 20), createNote('b', 220, 20)];

    const preview = buildInteractionPreviewElements({
      elements,
      updatedElement: {
        ...elements[0],
        position: { x: 83, y: 53 },
      },
      metadata: {
        interactionType: 'drag',
        dragDelta: { x: 63, y: 33 },
      },
      selectedElementIds: ['a', 'b'],
      snapToGrid: true,
    });

    expect(preview).toEqual([
      expect.objectContaining({
        id: 'a',
        position: { x: 80, y: 50 },
      }),
      expect.objectContaining({
        id: 'b',
        position: { x: 280, y: 50 },
      }),
    ]);
  });

  it('passes non-drag interaction previews through unchanged', () => {
    const element = createNote('a', 20, 20);

    const preview = buildInteractionPreviewElements({
      elements: [element],
      updatedElement: {
        ...element,
        width: 180,
      },
      metadata: {
        interactionType: 'resize',
      },
      selectedElementIds: ['a'],
      snapToGrid: true,
    });

    expect(preview).toEqual([
      expect.objectContaining({
        id: 'a',
        width: 180,
      }),
    ]);
  });
});
