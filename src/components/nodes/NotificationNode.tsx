'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NotificationData } from '@/types/diagram';

const NotificationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M22 8c0-1.1-.2-2.2-.5-3" strokeLinecap="round" />
    <path d="M2 8c0-1.1.2-2.2.5-3" strokeLinecap="round" />
  </svg>
);

export function NotificationNode({ id, data, selected }: NodeProps) {
  const nodeData = data as NotificationData & { isActive?: boolean };
  const hasDetails = nodeData.channels && nodeData.channels.length > 0;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<NotificationIcon />}
      color="#f43f5e"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Channels:</span>
            <span className="text-gray-700 font-medium">{nodeData.channels?.join(', ')}</span>
          </div>
        </div>
      )}
    </BaseNode>
  );
}
