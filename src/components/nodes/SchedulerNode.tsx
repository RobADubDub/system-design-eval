'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { SchedulerData } from '@/types/diagram';

const SchedulerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SchedulerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as SchedulerData & { isActive?: boolean };
  const hasDetails = nodeData.schedule || nodeData.timezone;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<SchedulerIcon />}
      color="#64748b"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.schedule && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Schedule:</span>
              <span className="text-gray-700 font-medium font-mono text-[10px]">{nodeData.schedule}</span>
            </div>
          )}
          {nodeData.timezone && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Timezone:</span>
              <span className="text-gray-700 font-medium">{nodeData.timezone}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
