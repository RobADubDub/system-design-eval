'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { LoadBalancerData } from '@/types/diagram';

// Load Balancer Icon (simplified scale/balance icon)
const LoadBalancerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="2" />
    <line x1="12" y1="7" x2="12" y2="12" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="6" y2="16" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="18" y1="12" x2="18" y2="16" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="12" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

export function LoadBalancerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as LoadBalancerData & { isActive?: boolean };
  const hasTechDetails = nodeData.algorithm || nodeData.healthCheck || nodeData.targets?.length;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<LoadBalancerIcon />}
      color="#8b5cf6"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasTechDetails && (
        <div className="space-y-1.5">
          {nodeData.algorithm && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Algorithm:</span>
              <span className="text-gray-700 font-medium">{nodeData.algorithm}</span>
            </div>
          )}
          {nodeData.healthCheck && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Health Check:</span>
              <span className="text-gray-700 font-medium">{nodeData.healthCheck}</span>
            </div>
          )}
          {nodeData.targets && nodeData.targets.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-500">Targets:</span>
              <span className="text-gray-700 font-medium ml-1">
                {nodeData.targets.length} instances
              </span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
