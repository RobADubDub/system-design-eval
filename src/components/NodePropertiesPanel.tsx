'use client';

import { CloudNode, CloudNodeType, CloudNodeData } from '@/types/diagram';

interface NodePropertiesPanelProps {
  node: CloudNode | null;
  onUpdateNode: (nodeId: string, data: Partial<CloudNodeData>) => void;
  onClose: () => void;
}

// Field definitions for each node type
const nodeTypeFields: Record<CloudNodeType, { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]> = {
  client: [
    { key: 'type', label: 'Client Type', type: 'select', options: ['web', 'mobile', 'iot', 'api'] },
  ],
  loadBalancer: [
    { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['round-robin', 'least-connections', 'ip-hash', 'weighted'] },
    { key: 'healthCheck', label: 'Health Check', type: 'text' },
  ],
  service: [
    { key: 'instances', label: 'Instances', type: 'number' },
    { key: 'technology', label: 'Technology', type: 'text' },
  ],
  database: [
    { key: 'type', label: 'Database Type', type: 'select', options: ['sql', 'nosql', 'graph', 'timeseries', 'cache'] },
    { key: 'engine', label: 'Engine', type: 'text' },
    { key: 'replication', label: 'Replication', type: 'select', options: ['none', 'primary-replica', 'multi-master'] },
  ],
  queue: [
    { key: 'type', label: 'Queue Type', type: 'select', options: ['fifo', 'priority', 'pubsub'] },
    { key: 'persistence', label: 'Persistent', type: 'select', options: ['true', 'false'] },
    { key: 'maxSize', label: 'Max Size', type: 'number' },
  ],
  cache: [
    { key: 'strategy', label: 'Strategy', type: 'select', options: ['write-through', 'write-back', 'write-around'] },
    { key: 'eviction', label: 'Eviction Policy', type: 'select', options: ['lru', 'lfu', 'ttl'] },
  ],
  serverlessFunction: [
    { key: 'runtime', label: 'Runtime', type: 'text' },
    { key: 'timeout', label: 'Timeout (s)', type: 'number' },
    { key: 'memory', label: 'Memory (MB)', type: 'number' },
  ],
  container: [
    { key: 'image', label: 'Image', type: 'text' },
    { key: 'replicas', label: 'Replicas', type: 'number' },
    { key: 'orchestrator', label: 'Orchestrator', type: 'select', options: ['kubernetes', 'ecs', 'docker-compose'] },
  ],
  blobStorage: [
    { key: 'versioning', label: 'Versioning', type: 'select', options: ['true', 'false'] },
    { key: 'replication', label: 'Replication', type: 'select', options: ['single', 'cross-region'] },
  ],
  cdn: [
    { key: 'caching', label: 'Caching', type: 'select', options: ['aggressive', 'standard', 'minimal'] },
  ],
  streamingBroker: [
    { key: 'partitions', label: 'Partitions', type: 'number' },
    { key: 'retention', label: 'Retention', type: 'text' },
  ],
  workflow: [
    { key: 'type', label: 'Type', type: 'select', options: ['orchestration', 'choreography'] },
    { key: 'durability', label: 'Durable', type: 'select', options: ['true', 'false'] },
  ],
  notification: [
    { key: 'channels', label: 'Channels', type: 'text' },
  ],
  scheduler: [
    { key: 'schedule', label: 'Schedule (cron)', type: 'text' },
    { key: 'timezone', label: 'Timezone', type: 'text' },
  ],
  apiGateway: [
    { key: 'authentication', label: 'Auth Method', type: 'select', options: ['jwt', 'api-key', 'oauth', 'none'] },
    { key: 'rateLimit', label: 'Rate Limit (/s)', type: 'number' },
  ],
};

// Type labels for display
const nodeTypeLabels: Record<CloudNodeType, string> = {
  client: 'Client',
  loadBalancer: 'Load Balancer',
  service: 'Service',
  database: 'Database',
  queue: 'Queue',
  cache: 'Cache',
  serverlessFunction: 'Function',
  container: 'Container',
  blobStorage: 'Blob Storage',
  cdn: 'CDN',
  streamingBroker: 'Stream Broker',
  workflow: 'Workflow',
  notification: 'Notifications',
  scheduler: 'Scheduler',
  apiGateway: 'API Gateway',
};

// Type colors for styling
const nodeTypeColors: Record<CloudNodeType, string> = {
  client: '#6366f1',
  loadBalancer: '#8b5cf6',
  service: '#3b82f6',
  database: '#10b981',
  queue: '#f59e0b',
  cache: '#ef4444',
  serverlessFunction: '#f97316',
  container: '#0ea5e9',
  blobStorage: '#84cc16',
  cdn: '#06b6d4',
  streamingBroker: '#a855f7',
  workflow: '#ec4899',
  notification: '#f43f5e',
  scheduler: '#64748b',
  apiGateway: '#7c3aed',
};

export function NodePropertiesPanel({ node, onUpdateNode, onClose }: NodePropertiesPanelProps) {
  if (!node) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-400">
        <p className="text-sm">Select a node to edit its properties</p>
      </div>
    );
  }

  const nodeType = node.type as CloudNodeType;
  const fields = nodeTypeFields[nodeType] || [];
  const color = nodeTypeColors[nodeType];

  const handleFieldChange = (key: string, value: string | number | boolean) => {
    // Convert string 'true'/'false' to boolean for persistence field
    let processedValue = value;
    if (key === 'persistence' && typeof value === 'string') {
      processedValue = value === 'true';
    }
    onUpdateNode(node.id, { [key]: processedValue });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-gray-800 text-sm">
            {nodeTypeLabels[nodeType]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Properties Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Label
          </label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Description
          </label>
          <textarea
            value={node.data.description || ''}
            onChange={(e) => onUpdateNode(node.id, { description: e.target.value })}
            placeholder="What does this component do?"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Type-specific fields */}
        {fields.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Technical Details
            </span>
            <div className="mt-2 space-y-3">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Notes
          </label>
          <textarea
            value={node.data.notes || ''}
            onChange={(e) => onUpdateNode(node.id, { notes: e.target.value })}
            placeholder="Additional notes, constraints, considerations..."
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
        Press Delete to remove node
      </div>
    </div>
  );
}
