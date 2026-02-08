'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { ServerlessFunctionData } from '@/types/diagram';

const ServerlessFunctionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ServerlessFunctionNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ServerlessFunctionData & { isActive?: boolean };
  const hasDetails = nodeData.runtime || nodeData.timeout || nodeData.memory;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<ServerlessFunctionIcon />}
      color="#f97316"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.runtime && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Runtime:</span>
              <span className="text-gray-700 font-medium">{nodeData.runtime}</span>
            </div>
          )}
          {nodeData.timeout && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Timeout:</span>
              <span className="text-gray-700 font-medium">{nodeData.timeout}s</span>
            </div>
          )}
          {nodeData.memory && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Memory:</span>
              <span className="text-gray-700 font-medium">{nodeData.memory}MB</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
