import { useState, useCallback, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryStateOptions {
  maxHistory?: number;
}

export function useHistoryState<T>(
  initialState: T,
  options: UseHistoryStateOptions = {}
) {
  const { maxHistory = 50 } = options;

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Update present state without adding to history (for incremental changes like dragging)
  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setHistory((h) => ({
      ...h,
      present: typeof updater === 'function' ? (updater as (prev: T) => T)(h.present) : updater,
    }));
  }, []);

  // Commit current state to history (call this when a discrete change is complete)
  const commit = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past, h.present].slice(-maxHistory),
      present: h.present,
      future: [],
    }));
  }, [maxHistory]);

  // Commit a new state in one operation (for atomic changes like add/delete)
  const commitState = useCallback((newState: T) => {
    setHistory((h) => ({
      past: [...h.past, h.present].slice(-maxHistory),
      present: newState,
      future: [],
    }));
  }, [maxHistory]);

  // Undo - go back to previous state
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  // Redo - go forward to next state
  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  // Check if undo/redo are available
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Cmd+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    setState,
    commit,
    commitState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.past.length,
    futureLength: history.future.length,
  };
}
