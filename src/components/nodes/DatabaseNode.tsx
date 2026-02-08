'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { DatabaseData } from '@/types/diagram';

// Database Icon (cylinder)
const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </svg>
);

export function DatabaseNode({ id, data, selected }: NodeProps) {
  const nodeData = data as DatabaseData & { isActive?: boolean };
  const hasTechDetails = nodeData.type || nodeData.engine || nodeData.replication;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<DatabaseIcon />}
      color="#10b981"
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
          {nodeData.engine && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Engine:</span>
              <span className="text-gray-700 font-medium">{nodeData.engine}</span>
            </div>
          )}
          {nodeData.replication && nodeData.replication !== 'none' && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Replication:</span>
              <span className="text-gray-700 font-medium">{nodeData.replication}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
