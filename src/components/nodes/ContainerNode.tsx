'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { ContainerData } from '@/types/diagram';

const ContainerIcon = () => (
  <img src="/icons/ContainerServiceIcon.png" width="24" height="24" alt="Container" />
);

export function ContainerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ContainerData & { isActive?: boolean };
  const hasDetails = nodeData.image || nodeData.replicas || nodeData.orchestrator;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<ContainerIcon />}
      color="#0ea5e9"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.image && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Image:</span>
              <span className="text-gray-700 font-medium font-mono text-[10px]">{nodeData.image}</span>
            </div>
          )}
          {nodeData.replicas && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Replicas:</span>
              <span className="text-gray-700 font-medium">{nodeData.replicas}</span>
            </div>
          )}
          {nodeData.orchestrator && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Orchestrator:</span>
              <span className="text-gray-700 font-medium">{nodeData.orchestrator}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
