'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { ClientData } from '@/types/diagram';

// Client Icon (user/device)
const ClientIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
  </svg>
);

export function ClientNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ClientData & { isActive?: boolean };
  const hasTechDetails = nodeData.type;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<ClientIcon />}
      color="#6366f1"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasTechDetails && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Type:</span>
            <span className="text-gray-700 font-medium capitalize">{nodeData.type}</span>
          </div>
        </div>
      )}
    </BaseNode>
  );
}
