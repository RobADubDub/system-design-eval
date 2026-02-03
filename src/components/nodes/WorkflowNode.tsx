'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { WorkflowData } from '@/types/diagram';

const WorkflowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="3" width="6" height="6" rx="1" />
    <rect x="9" y="15" width="6" height="6" rx="1" />
    <path d="M9 6h6" strokeLinecap="round" />
    <path d="M6 9v3a3 3 0 0 0 3 3h0" strokeLinecap="round" />
    <path d="M18 9v3a3 3 0 0 1-3 3h0" strokeLinecap="round" />
  </svg>
);

export function WorkflowNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowData & { isActive?: boolean };
  const hasDetails = nodeData.type || nodeData.durability !== undefined;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<WorkflowIcon />}
      color="#ec4899"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.type && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-700 font-medium">{nodeData.type}</span>
            </div>
          )}
          {nodeData.durability !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Durable:</span>
              <span className="text-gray-700 font-medium">{nodeData.durability ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
