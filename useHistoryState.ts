
import { useState, useCallback, useMemo } from 'react';

type SetStateOptions = {
  addToHistory?: boolean;
};

export const useHistoryState = <T>(initialState: T) => {
  const [internalState, setInternalState] = useState({
    history: [initialState],
    index: 0
  });

  const state = useMemo(() => internalState.history[internalState.index], [internalState]);
  const canUndo = internalState.index > 0;
  const canRedo = internalState.index < internalState.history.length - 1;

  const setState = useCallback((
    action: T | ((prevState: T) => T),
    options: SetStateOptions = { addToHistory: true }
  ) => {
    setInternalState(prev => {
      const currentSnapshot = prev.history[prev.index];
      const resolvedState = typeof action === 'function'
        ? (action as (prevState: T) => T)(currentSnapshot)
        : action;

      if (options.addToHistory) {
        const newHistory = prev.history.slice(0, prev.index + 1);
        newHistory.push(resolvedState);
        return {
          history: newHistory,
          index: newHistory.length - 1
        };
      } else {
        const newHistory = [...prev.history];
        newHistory[prev.index] = resolvedState;
        return {
          ...prev,
          history: newHistory
        };
      }
    });
  }, []);

  const undo = useCallback(() => {
    setInternalState(prev => {
      if (prev.index > 0) {
        return { ...prev, index: prev.index - 1 };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setInternalState(prev => {
      if (prev.index < prev.history.length - 1) {
        return { ...prev, index: prev.index + 1 };
      }
      return prev;
    });
  }, []);
  
  return { state, setState, undo, redo, canUndo, canRedo };
};
