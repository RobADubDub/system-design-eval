'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { ApiGatewayData } from '@/types/diagram';

const ApiGatewayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <path d="M8 10h.01" strokeLinecap="round" />
    <path d="M12 10h.01" strokeLinecap="round" />
    <path d="M16 10h.01" strokeLinecap="round" />
    <path d="M8 14h8" strokeLinecap="round" />
  </svg>
);

export function ApiGatewayNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ApiGatewayData & { isActive?: boolean };
  const hasDetails = nodeData.rateLimit || nodeData.authentication;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<ApiGatewayIcon />}
      color="#7c3aed"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.authentication && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Auth:</span>
              <span className="text-gray-700 font-medium">{nodeData.authentication}</span>
            </div>
          )}
          {nodeData.rateLimit && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Rate Limit:</span>
              <span className="text-gray-700 font-medium">{nodeData.rateLimit}/s</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
