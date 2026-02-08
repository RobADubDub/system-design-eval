'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { QueueData } from '@/types/diagram';

// Queue Icon (stacked messages)
const QueueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="5" rx="1" />
    <rect x="3" y="10" width="18" height="5" rx="1" />
    <rect x="3" y="17" width="12" height="5" rx="1" />
    <path d="M18 19l2-2-2-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function QueueNode({ id, data, selected }: NodeProps) {
  const nodeData = data as QueueData & { isActive?: boolean };
  const hasTechDetails = nodeData.type || nodeData.persistence !== undefined || nodeData.maxSize;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<QueueIcon />}
      color="#f59e0b"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasTechDetails && (
        <div className="space-y-1.5">
          {nodeData.type && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-700 font-medium uppercase">{nodeData.type}</span>
            </div>
          )}
          {nodeData.persistence !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Persistent:</span>
              <span className="text-gray-700 font-medium">
                {nodeData.persistence ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          {nodeData.maxSize && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Max Size:</span>
              <span className="text-gray-700 font-medium">{nodeData.maxSize}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
