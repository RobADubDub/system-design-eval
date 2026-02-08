'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { CdnData } from '@/types/diagram';

const CdnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export function CdnNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CdnData & { isActive?: boolean };
  const hasDetails = nodeData.origins?.length || nodeData.caching;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<CdnIcon />}
      color="#06b6d4"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      popoverPlacement={nodeData.popoverPlacement}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.caching && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Caching:</span>
              <span className="text-gray-700 font-medium">{nodeData.caching}</span>
            </div>
          )}
          {nodeData.origins && nodeData.origins.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-500">Origins: </span>
              <span className="text-gray-700">{nodeData.origins.length}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
