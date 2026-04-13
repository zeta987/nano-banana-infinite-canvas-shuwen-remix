import type { CanvasElement, Point } from '../types';

export type InteractionUpdateMetadata = {
  interactionType?:
    | 'drag'
    | 'resize'
    | 'rotate'
    | 'resize-arrow-start'
    | 'resize-arrow-end';
  dragDelta?: Point;
};

export const buildInteractionPreviewElements = ({
  elements,
  updatedElement,
  metadata,
  selectedElementIds,
  snapToGrid,
  gridSize = 10,
}: {
  elements: CanvasElement[];
  updatedElement: CanvasElement;
  metadata?: InteractionUpdateMetadata;
  selectedElementIds: string[];
  snapToGrid: boolean;
  gridSize?: number;
}): CanvasElement[] => {
  if (!metadata?.interactionType) {
    return [updatedElement];
  }

  const snap = (value: number) =>
    snapToGrid ? Math.round(value / gridSize) * gridSize : value;

  const selectedElementIdSet = new Set(selectedElementIds);

  if (
    metadata.interactionType === 'drag' &&
    metadata.dragDelta &&
    selectedElementIdSet.size > 1 &&
    selectedElementIdSet.has(updatedElement.id)
  ) {
    return elements
      .filter((element) => selectedElementIdSet.has(element.id))
      .map((element) => {
        const nextX = snap(element.position.x + metadata.dragDelta!.x);
        const nextY = snap(element.position.y + metadata.dragDelta!.y);

        if (element.id === updatedElement.id) {
          return {
            ...updatedElement,
            position: { x: nextX, y: nextY },
          } as CanvasElement;
        }

        return {
          ...element,
          position: { x: nextX, y: nextY },
        } as CanvasElement;
      });
  }

  if (metadata.interactionType === 'drag') {
    return [
      {
        ...updatedElement,
        position: {
          x: snap(updatedElement.position.x),
          y: snap(updatedElement.position.y),
        },
      } as CanvasElement,
    ];
  }

  return [updatedElement];
};
