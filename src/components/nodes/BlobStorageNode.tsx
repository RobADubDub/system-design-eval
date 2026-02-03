'use client';

import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { BlobStorageData } from '@/types/diagram';

const BlobStorageIcon = () => (
  <img src="/icons/BlobStorageIcon.png" width="24" height="24" alt="Blob Storage" />
);

export function BlobStorageNode({ id, data, selected }: NodeProps) {
  const nodeData = data as BlobStorageData & { isActive?: boolean };
  const hasDetails = nodeData.versioning !== undefined || nodeData.replication;

  return (
    <BaseNode
      id={id}
      label={nodeData.label}
      icon={<BlobStorageIcon />}
      color="#84cc16"
      selected={selected}
      description={nodeData.description}
      notes={nodeData.notes}
      isActive={nodeData.isActive}
    >
      {hasDetails && (
        <div className="space-y-1.5">
          {nodeData.versioning !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Versioning:</span>
              <span className="text-gray-700 font-medium">{nodeData.versioning ? 'Enabled' : 'Disabled'}</span>
            </div>
          )}
          {nodeData.replication && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Replication:</span>
              <span className="text-gray-700 font-medium">{nodeData.replication}</span>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}
