'use client';

import { useState, useRef, useCallback, useEffect, MouseEvent, KeyboardEvent } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { TextData, TextFontSize, SpecItem, generateSpecItemId } from '@/types/diagram';
import { SpecificationEditor } from '../specifications/SpecificationEditor';

const TEXT_SIZE_CLASS: Record<TextFontSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

const FONT_SIZES: TextFontSize[] = ['sm', 'md', 'lg'];

// Render items recursively for display (non-editing mode)
function renderItems(items: SpecItem[], sizeClass: string, depth: number = 0): React.ReactNode {
  return items.map((item) => (
    <div key={item.id}>
      <div
        className={`flex items-start ${sizeClass} text-gray-700`}
        style={{ paddingLeft: depth * 12 }}
      >
        <span className="text-gray-400 mr-1.5 mt-0.5 text-xs select-none">&bull;</span>
        <span className="leading-tight">{item.text || <span className="text-gray-400 italic">Empty</span>}</span>
      </div>
      {item.children.length > 0 && renderItems(item.children, sizeClass, depth + 1)}
    </div>
  ));
}

const DEFAULT_ITEMS: SpecItem[] = [
  { id: 'initial', text: '', children: [] },
];

export function TextNode({ id, data, selected }: NodeProps) {
  const nodeData = data as TextData & { isActive?: boolean };
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabelValue, setEditLabelValue] = useState(nodeData.label);
  const boxRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();

  // Keep items in local state so SpecificationEditor gets synchronous updates
  // (going through setNodes/zustand causes an async re-render that resets cursor position)
  const [localItems, setLocalItems] = useState<SpecItem[]>(
    nodeData.items ?? DEFAULT_ITEMS
  );

  // Sync from external changes (undo/redo, AI, load)
  const externalItems = nodeData.items;
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditing;
  useEffect(() => {
    if (!isEditingRef.current && externalItems) {
      setLocalItems(externalItems);
    }
  }, [externalItems]);

  const collapsed = nodeData.collapsed ?? false;
  const fontSize: TextFontSize = nodeData.fontSize ?? 'md';
  const sizeClass = TEXT_SIZE_CLASS[fontSize];

  const visibleItems = collapsed
    ? localItems.map(i => ({ ...i, children: [] }))
    : localItems;

  // Focus label input when editing starts
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Sync label value when it changes externally
  useEffect(() => {
    if (!isEditingLabel) {
      setEditLabelValue(nodeData.label);
    }
  }, [nodeData.label, isEditingLabel]);

  const handleContentClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleItemsUpdate = useCallback((newItems: SpecItem[]) => {
    setLocalItems(newItems); // Synchronous — preserves cursor position
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, items: newItems } } : node
      )
    );
  }, [id, setNodes]);

  const handleCloseEditor = useCallback(() => {
    setIsEditing(false);
    // Sync local state from node data on close, in case external updates arrived
    if (nodeData.items) {
      setLocalItems(nodeData.items);
    }
  }, [nodeData.items]);

  const handleToggleCollapse = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, collapsed: !collapsed } } : node
      )
    );
  }, [id, collapsed, setNodes]);

  const handleFontSizeChange = useCallback((size: TextFontSize) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, fontSize: size } } : node
      )
    );
  }, [id, setNodes]);

  const handleLabelDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  }, []);

  const handleLabelSave = useCallback(() => {
    const trimmed = editLabelValue.trim();
    if (trimmed) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label: trimmed } } : node
        )
      );
    } else {
      setEditLabelValue(nodeData.label);
    }
    setIsEditingLabel(false);
  }, [id, editLabelValue, nodeData.label, setNodes]);

  const handleLabelKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelSave();
    } else if (e.key === 'Escape') {
      setEditLabelValue(nodeData.label);
      setIsEditingLabel(false);
    }
  }, [handleLabelSave, nodeData.label]);

  // Handle click outside to close edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };

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
        isEditing ? 'ring-2 ring-blue-400' : selected ? 'ring-2 ring-blue-400 ring-offset-2' : 'hover:border-gray-300'
      }`}
    >
      {/* Header with label and collapse toggle */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        {isEditingLabel ? (
          <input
            ref={labelInputRef}
            type="text"
            value={editLabelValue}
            onChange={(e) => setEditLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={handleLabelKeyDown}
            className="text-xs font-medium text-gray-600 bg-white border border-blue-400 rounded px-1 py-0.5 outline-none max-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs text-gray-500 font-medium select-none cursor-text"
            onDoubleClick={handleLabelDoubleClick}
            title="Double-click to rename"
          >
            {nodeData.label || 'Text'}
          </span>
        )}
        <div className="flex items-center gap-1">
          {/* Font size toggle */}
          <div className="flex items-center border border-gray-200 rounded overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange(size); }}
                className={`px-1 text-[9px] font-medium leading-none py-0.5 ${
                  fontSize === size
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={`Font size: ${size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}`}
              >
                {size === 'sm' ? 'S' : size === 'md' ? 'M' : 'L'}
              </button>
            ))}
          </div>
          <button
            onClick={handleToggleCollapse}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - click to edit */}
      <div
        className={`p-2 ${isEditing ? '' : 'cursor-pointer hover:bg-gray-50 rounded-b-lg'}`}
        onClick={isEditing ? undefined : handleContentClick}
      >
        {isEditing ? (
          <SpecificationEditor
            items={localItems}
            onUpdate={handleItemsUpdate}
            onClose={handleCloseEditor}
            textClassName={sizeClass}
          />
        ) : (
          <div className="space-y-0.5">
            {renderItems(visibleItems, sizeClass)}
            {localItems.length === 0 && (
              <div className="text-xs text-gray-400 italic">
                Click to add text
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
