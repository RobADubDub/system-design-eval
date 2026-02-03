'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { ServiceData } from '@/types/diagram';

// Service Icon (server/box icon)
const ServiceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="7" cy="14" r="1" fill="currentColor" />
  </svg>
);

export function ServiceNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ServiceData & { isActive?: boolean };
  const hasTechDetails = nodeData.technology || nodeData.instances || nodeData.endpoints?.length;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<ServiceIcon />}
      color="#3b82f6"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasTechDetails && (
        <div className="space-y-1.5">
          {nodeData.technology && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Technology:</span>
              <span className="text-gray-700 font-medium">{nodeData.technology}</span>
            </div>
          )}
          {nodeData.instances && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Instances:</span>
              <span className="text-gray-700 font-medium">{nodeData.instances}</span>
            </div>
          )}
          {nodeData.endpoints && nodeData.endpoints.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-500">Endpoints:</span>
              <ul className="mt-1 space-y-0.5 text-gray-600">
                {nodeData.endpoints.slice(0, 3).map((ep, i) => (
                  <li key={i} className="font-mono text-[10px]">{ep}</li>
                ))}
                {nodeData.endpoints.length > 3 && (
                  <li className="text-gray-400">+{nodeData.endpoints.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
