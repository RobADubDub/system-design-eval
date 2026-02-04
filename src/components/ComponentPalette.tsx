'use client';

import { DragEvent } from 'react';
import { CloudNodeType } from '@/types/diagram';
import { COMPONENT_REGISTRY, PALETTE_ORDER } from '@/lib/components/registry';

export function ComponentPalette() {
  const onDragStart = (event: DragEvent, nodeType: CloudNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <h2 className="text-sm font-semibold text-gray-700">Components</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="space-y-2">
          {PALETTE_ORDER.map((type) => {
            const meta = COMPONENT_REGISTRY[type];
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                className="flex items-center gap-2 p-2 rounded-md border border-gray-200
                           cursor-grab hover:bg-gray-50 hover:border-gray-300
                           active:cursor-grabbing transition-colors"
              >
                <div style={{ color: meta.color }}>{meta.icon}</div>
                <span className="text-sm text-gray-600">{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Drag components onto the canvas
        </p>
      </div>
    </div>
  );
}
