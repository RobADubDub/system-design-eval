'use client';

import { DragEvent } from 'react';
import { CloudNodeType } from '@/types/diagram';
import { COMPONENT_REGISTRY, PALETTE_ORDER } from '@/lib/components/registry';

// Icons for each component type
const COMPONENT_ICONS: Record<CloudNodeType, React.ReactNode> = {
  client: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
    </svg>
  ),
  apiGateway: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="M8 10h.01" strokeLinecap="round" />
      <path d="M12 10h.01" strokeLinecap="round" />
      <path d="M16 10h.01" strokeLinecap="round" />
      <path d="M8 14h8" strokeLinecap="round" />
    </svg>
  ),
  loadBalancer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="6" y2="16" />
      <line x1="18" y1="12" x2="18" y2="16" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  cdn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  service: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  serverlessFunction: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  container: (
    <img src="/icons/ContainerServiceIcon.png" width="20" height="20" alt="Container" />
  ),
  database: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  ),
  cache: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  blobStorage: (
    <img src="/icons/BlobStorageIcon.png" width="20" height="20" alt="Blob Storage" />
  ),
  queue: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="5" rx="1" />
      <rect x="3" y="10" width="18" height="5" rx="1" />
      <rect x="3" y="17" width="12" height="5" rx="1" />
      <path d="M18 19l2-2-2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eventStream: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h16" strokeLinecap="round" />
      <path d="M4 6h16" strokeLinecap="round" />
      <path d="M4 18h16" strokeLinecap="round" />
      <path d="M18 9l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 15l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  workflow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h6" strokeLinecap="round" />
      <path d="M6 9v3a3 3 0 0 0 3 3h0" strokeLinecap="round" />
      <path d="M18 9v3a3 3 0 0 1-3 3h0" strokeLinecap="round" />
    </svg>
  ),
  scheduler: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  notification: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M22 8c0-1.1-.2-2.2-.5-3" strokeLinecap="round" />
      <path d="M2 8c0-1.1.2-2.2.5-3" strokeLinecap="round" />
    </svg>
  ),
};

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
                <div style={{ color: meta.color }}>{COMPONENT_ICONS[type]}</div>
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
