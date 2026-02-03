'use client';

import { useCallback, useEffect } from 'react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onAskAI?: () => void;
  onAddSpecification?: () => void;
  hasSpecification?: boolean;
  type: 'node' | 'edge' | 'canvas';
}

export function ContextMenu({
  x,
  y,
  onClose,
  onDelete,
  onDuplicate,
  onEdit,
  onAskAI,
  onAddSpecification,
  hasSpecification,
  type,
}: ContextMenuProps) {
  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleAction = useCallback(
    (action: (() => void) | undefined) => (e: React.MouseEvent) => {
      e.stopPropagation();
      action?.();
      onClose();
    },
    [onClose]
  );

  return (
    <div
      className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'node' && (
        <>
          {onEdit && (
            <button
              onClick={handleAction(onEdit)}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-gray-400">✏️</span>
              Edit Properties
            </button>
          )}
          {onAskAI && (
            <button
              onClick={handleAction(onAskAI)}
              className="w-full px-3 py-1.5 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
            >
              <span>✨</span>
              Ask AI
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={handleAction(onDuplicate)}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-gray-400">📋</span>
              Duplicate
            </button>
          )}
          {onAddSpecification && !hasSpecification && (
            <button
              onClick={handleAction(onAddSpecification)}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-gray-400">📝</span>
              Add Specification
            </button>
          )}
          {(onEdit || onDuplicate || onAskAI || onAddSpecification) && onDelete && (
            <div className="border-t border-gray-100 my-1" />
          )}
        </>
      )}
      {onDelete && (
        <button
          onClick={handleAction(onDelete)}
          className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <span>🗑️</span>
          Delete {type === 'edge' ? 'Connection' : type === 'node' ? 'Node' : ''}
        </button>
      )}
    </div>
  );
}
