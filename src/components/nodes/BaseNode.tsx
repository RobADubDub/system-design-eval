'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useEditing } from './EditingContext';

interface BaseNodeProps {
  id: string;
  label: string;
  icon: ReactNode;
  color: string;
  selected?: boolean;
  description?: string;
  notes?: string;
  children?: ReactNode; // Optional technical details
  isActive?: boolean; // For flow simulation highlighting
}

export function BaseNode({
  id,
  label,
  icon,
  color,
  selected,
  description,
  notes,
  children,
  isActive,
}: BaseNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();
  const { editingNodeId, clearEditing } = useEditing();

  const showDetails = isHovered && !isEditing;
  const hasDetails = description || notes || children;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update edit value when label changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(label);
    }
  }, [label, isEditing]);

  // Trigger inline editing from context (Enter key)
  useEffect(() => {
    if (editingNodeId === id && !isEditing) {
      setIsEditing(true);
      clearEditing();
    }
  }, [editingNodeId, id, isEditing, clearEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim()) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() } }
            : node
        )
      );
    } else {
      setEditValue(label); // Reset to original if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main node body */}
      <div
        className={`
          flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2
          bg-white shadow-md transition-all duration-200 min-w-[70px]
          ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
          ${isActive ? 'ring-2 ring-green-500 ring-offset-2 animate-pulse' : ''}
        `}
        style={{ borderColor: isActive ? '#22c55e' : color }}
      >
        <div className="text-2xl" style={{ color: isActive ? '#22c55e' : color }}>
          {icon}
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-xs font-medium text-gray-700 max-w-[100px] bg-white border border-blue-400 rounded px-1 py-0.5 outline-none text-center"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs font-medium text-gray-700 max-w-[100px] truncate cursor-text"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {label}
          </span>
        )}
      </div>

      {/* Expandable details panel */}
      {showDetails && hasDetails && (
        <div
          className={`
            absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50
            bg-white border border-gray-200 rounded shadow-lg px-2 py-1.5
            min-w-[140px] max-w-[220px]
            animate-in fade-in slide-in-from-top-1 duration-200
          `}
        >
          {/* Description - primary info about what this component does */}
          {description && (
            <p className="text-[10px] text-gray-700 leading-tight">{description}</p>
          )}

          {/* Technical details - optional, only shown if provided */}
          {children && (
            <div className={description ? 'mt-1 pt-1 border-t border-gray-100' : ''}>
              {children}
            </div>
          )}

          {/* Notes - additional considerations */}
          {notes && (
            <div className="mt-1 pt-1 border-t border-gray-100">
              <span className="text-[9px] uppercase tracking-wide font-medium text-gray-400">Notes</span>
              <p className="text-[10px] text-gray-600 leading-tight">{notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Connection handles - all 4 sides, bidirectional (overlapping source+target) */}
      {/* Top */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      {/* Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      {/* Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      {/* Left */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}
