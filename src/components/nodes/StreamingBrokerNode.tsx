'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { StreamingBrokerData } from '@/types/diagram';

const StreamingBrokerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h16" strokeLinecap="round" />
    <path d="M4 6h16" strokeLinecap="round" />
    <path d="M4 18h16" strokeLinecap="round" />
    <path d="M18 9l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 15l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StreamingBrokerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as StreamingBrokerData & { isActive?: boolean };
  const hasDetails = nodeData.partitions || nodeData.retention;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<StreamingBrokerIcon />}
      color="#a855f7"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.partitions && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Partitions:</span>
              <span className="text-gray-700 font-medium">{nodeData.partitions}</span>
            </div>
          )}
          {nodeData.retention && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Retention:</span>
              <span className="text-gray-700 font-medium">{nodeData.retention}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
