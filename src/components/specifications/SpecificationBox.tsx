'use client';

import { useState, useRef, useCallback, useEffect, MouseEvent } from 'react';
import { NodeSpecification, SpecItem, calculateVisibleLevels } from '@/types/diagram';
import { SpecificationEditor } from './SpecificationEditor';

interface SpecificationBoxProps {
  spec: NodeSpecification;
  availableHeight: number;
  zoom: number; // Current viewport zoom level
  onUpdate: (spec: NodeSpecification) => void;
  onDelete: () => void;
  onPositionChange: (newOffsetX: number, newOffsetY: number) => void;
}

// Render items recursively for display (non-editing mode)
function renderItems(items: SpecItem[], depth: number = 0): React.ReactNode {
  return items.map((item) => (
    <div key={item.id}>
      <div
        className="flex items-start text-sm text-gray-700"
        style={{ paddingLeft: depth * 12 }}
      >
        <span className="text-gray-400 mr-1.5 mt-0.5 text-xs select-none">•</span>
        <span className="leading-tight">{item.text || <span className="text-gray-400 italic">Empty</span>}</span>
      </div>
      {item.children.length > 0 && renderItems(item.children, depth + 1)}
    </div>
  ));
}

export function SpecificationBox({
  spec,
  availableHeight,
  zoom,
  onUpdate,
  onDelete,
  onPositionChange,
}: SpecificationBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  // Calculate visible items based on available height
  const lineHeight = 24;
  const { visibleItems, hiddenCount } = spec.collapsed
    ? { visibleItems: spec.items.map(i => ({ ...i, children: [] })), hiddenCount: 0 }
    : calculateVisibleLevels(spec.items, availableHeight, lineHeight);

  // Handle drag start on header
  const handleHeaderMouseDown = useCallback((e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: spec.offsetX,
      offsetY: spec.offsetY,
    };
  }, [spec.offsetX, spec.offsetY]);

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const flowDeltaX = deltaX / zoom;
      const flowDeltaY = deltaY / zoom;

      onPositionChange(
        dragStartRef.current.offsetX + flowDeltaX,
        dragStartRef.current.offsetY + flowDeltaY
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange, zoom]);

  // Handle click on content area to enter edit mode
  const handleContentClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Handle double-click on content area to enter edit mode
  const handleContentDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Handle items update from editor
  const handleItemsUpdate = useCallback((items: SpecItem[]) => {
    onUpdate({ ...spec, items });
  }, [spec, onUpdate]);

  // Handle close editing
  const handleCloseEditor = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle toggle collapse
  const handleToggleCollapse = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate({ ...spec, collapsed: !spec.collapsed });
  }, [spec, onUpdate]);

  // Handle delete - works even in edit mode
  const handleDelete = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false); // Close edit mode first
    onDelete();
  }, [onDelete]);

  // Handle keyboard shortcuts (Delete, Enter)
  useEffect(() => {
    if (isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isFocused = document.activeElement === boxRef.current || boxRef.current?.contains(document.activeElement);
      if (!isFocused) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onDelete]);

  // Handle click outside to close edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };

    // Use setTimeout to avoid immediate trigger from the click that opened edit mode
    // Use capture phase to catch events before ReactFlow can stop propagation
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isEditing]);

  return (
    <div
      ref={boxRef}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm min-w-[180px] max-w-[300px] ${
        isEditing ? 'ring-2 ring-blue-400' : 'hover:border-gray-300'
      }`}
      style={{
        userSelect: isDragging ? 'none' : 'auto',
      }}
      tabIndex={0}
    >
      {/* Header with actions - draggable */}
      <div
        className={`flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50 rounded-t-lg ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="text-xs text-gray-500 font-medium select-none">Spec</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleCollapse}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
            title={spec.collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${spec.collapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-0.5 text-gray-400 hover:text-red-500 rounded"
            title="Delete specification"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - clickable to edit */}
      <div
        className={`p-2 ${isEditing ? '' : 'cursor-pointer hover:bg-gray-50'}`}
        onClick={isEditing ? undefined : handleContentClick}
        onDoubleClick={isEditing ? undefined : handleContentDoubleClick}
      >
        {isEditing ? (
          <SpecificationEditor
            items={spec.items}
            onUpdate={handleItemsUpdate}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="space-y-0.5">
            {renderItems(visibleItems)}
            {hiddenCount > 0 && (
              <div className="text-xs text-gray-400 italic mt-1 pl-1">
                [+{hiddenCount} more...]
              </div>
            )}
            {spec.items.length === 0 && (
              <div className="text-xs text-gray-400 italic">
                Click to add items
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
