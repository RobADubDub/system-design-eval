'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { EventStreamData } from '@/types/diagram';
import { getComponentColor } from '@/lib/components/registry';

const EventStreamIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h16" strokeLinecap="round" />
    <path d="M4 6h16" strokeLinecap="round" />
    <path d="M4 18h16" strokeLinecap="round" />
    <path d="M18 9l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 15l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function EventStreamNode({ id, data, selected }: NodeProps) {
  const nodeData = data as EventStreamData & { isActive?: boolean };
  const hasDetails = nodeData.partitions || nodeData.retention;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<EventStreamIcon />}
      color={getComponentColor('eventStream')}
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
