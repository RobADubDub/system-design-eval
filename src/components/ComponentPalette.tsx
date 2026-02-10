'use client';

import { DragEvent, useState, useCallback } from 'react';
import { CloudNodeType } from '@/types/diagram';
import { COMPONENT_REGISTRY, PALETTE_ORDER } from '@/lib/components/registry';
import { COMPONENT_REFERENCE } from '@/lib/components/reference';

export function ComponentPalette() {
  const [tooltip, setTooltip] = useState<{ type: CloudNodeType; iconRect: DOMRect } | null>(null);

  const onDragStart = (event: DragEvent, nodeType: CloudNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const showTooltip = (type: CloudNodeType, iconEl: HTMLElement) => {
    setTooltip({ type, iconRect: iconEl.getBoundingClientRect() });
  };

  const hideTooltip = () => setTooltip(null);

  // Callback ref: positions the tooltip within viewport, then reveals it
  const tooltipRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !tooltip) return;

      const pad = 8;
      const { iconRect } = tooltip;
      const tipRect = el.getBoundingClientRect();

      // Prefer right of the icon (towards the canvas)
      let left = iconRect.right + pad;
      let top = iconRect.top + iconRect.height / 2 - tipRect.height / 2;

      // Clip right → flip to left of icon
      if (left + tipRect.width > window.innerWidth - pad) {
        left = iconRect.left - tipRect.width - pad;
      }
      // Clip bottom
      if (top + tipRect.height > window.innerHeight - pad) {
        top = window.innerHeight - tipRect.height - pad;
      }
      // Clip top
      if (top < pad) {
        top = pad;
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.visibility = 'visible';
    },
    [tooltip],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="space-y-1">
          {PALETTE_ORDER.map((type) => {
            const meta = COMPONENT_REGISTRY[type];
            const ref = COMPONENT_REFERENCE[type];

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
                <span className="text-sm text-gray-600 flex-1">{meta.label}</span>
                {ref && (
                  <span
                    onMouseEnter={(e) => showTooltip(type, e.currentTarget)}
                    onMouseLeave={hideTooltip}
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-xs
                               transition-colors cursor-default flex-shrink-0
                               ${tooltip?.type === type
                                 ? 'text-gray-600 bg-gray-100'
                                 : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                               }`}
                    aria-label={`Info about ${meta.label}`}
                  >
                    i
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip rendered outside the scroll container to avoid clipping */}
      {tooltip && COMPONENT_REFERENCE[tooltip.type] && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-56 p-2.5 rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{ visibility: 'hidden' }}
        >
          <p className="text-xs text-gray-600 leading-relaxed">
            {COMPONENT_REFERENCE[tooltip.type]!.summary}
          </p>
        </div>
      )}
    </div>
  );
}
