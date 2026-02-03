'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { CacheData } from '@/types/diagram';

// Cache Icon (lightning bolt for speed)
const CacheIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export function CacheNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CacheData & { isActive?: boolean };
  const hasTechDetails = nodeData.strategy || nodeData.eviction;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<CacheIcon />}
      color="#ef4444"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasTechDetails && (
        <div className="space-y-1.5">
          {nodeData.strategy && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Strategy:</span>
              <span className="text-gray-700 font-medium">{nodeData.strategy}</span>
            </div>
          )}
          {nodeData.eviction && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Eviction:</span>
              <span className="text-gray-700 font-medium uppercase">{nodeData.eviction}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
