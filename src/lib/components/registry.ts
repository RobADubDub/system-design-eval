import { CloudNodeType } from '@/types/diagram';

// Field definition for node properties
export interface PropertyField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

// Complete metadata for a component type
export interface ComponentMeta {
  type: CloudNodeType;
  label: string;
  color: string;
  properties: PropertyField[];
}

// Single source of truth for all component metadata
export const COMPONENT_REGISTRY: Record<CloudNodeType, ComponentMeta> = {
  client: {
    type: 'client',
    label: 'Client',
    color: '#6366f1',
    properties: [
      { key: 'type', label: 'Client Type', type: 'select', options: ['web', 'mobile', 'iot', 'api'] },
    ],
  },
  apiGateway: {
    type: 'apiGateway',
    label: 'API Gateway',
    color: '#7c3aed',
    properties: [
      { key: 'authentication', label: 'Auth Method', type: 'select', options: ['jwt', 'api-key', 'oauth', 'none'] },
      { key: 'rateLimit', label: 'Rate Limit (/s)', type: 'number' },
    ],
  },
  loadBalancer: {
    type: 'loadBalancer',
    label: 'Load Balancer',
    color: '#8b5cf6',
    properties: [
      { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['round-robin', 'least-connections', 'ip-hash', 'weighted'] },
      { key: 'healthCheck', label: 'Health Check', type: 'text' },
    ],
  },
  cdn: {
    type: 'cdn',
    label: 'CDN',
    color: '#06b6d4',
    properties: [
      { key: 'caching', label: 'Caching', type: 'select', options: ['aggressive', 'standard', 'minimal'] },
    ],
  },
  service: {
    type: 'service',
    label: 'Service',
    color: '#3b82f6',
    properties: [
      { key: 'instances', label: 'Instances', type: 'number' },
      { key: 'technology', label: 'Technology', type: 'text' },
    ],
  },
  serverlessFunction: {
    type: 'serverlessFunction',
    label: 'Function',
    color: '#f97316',
    properties: [
      { key: 'runtime', label: 'Runtime', type: 'text' },
      { key: 'timeout', label: 'Timeout (s)', type: 'number' },
      { key: 'memory', label: 'Memory (MB)', type: 'number' },
    ],
  },
  container: {
    type: 'container',
    label: 'Container',
    color: '#0ea5e9',
    properties: [
      { key: 'image', label: 'Image', type: 'text' },
      { key: 'replicas', label: 'Replicas', type: 'number' },
      { key: 'orchestrator', label: 'Orchestrator', type: 'select', options: ['kubernetes', 'ecs', 'docker-compose'] },
    ],
  },
  database: {
    type: 'database',
    label: 'Database',
    color: '#10b981',
    properties: [
      { key: 'type', label: 'Database Type', type: 'select', options: ['sql', 'nosql', 'graph', 'timeseries', 'cache'] },
      { key: 'engine', label: 'Engine', type: 'text' },
      { key: 'replication', label: 'Replication', type: 'select', options: ['none', 'primary-replica', 'multi-master'] },
    ],
  },
  cache: {
    type: 'cache',
    label: 'Cache',
    color: '#ef4444',
    properties: [
      { key: 'strategy', label: 'Strategy', type: 'select', options: ['write-through', 'write-back', 'write-around'] },
      { key: 'eviction', label: 'Eviction Policy', type: 'select', options: ['lru', 'lfu', 'ttl'] },
    ],
  },
  blobStorage: {
    type: 'blobStorage',
    label: 'Blob Storage',
    color: '#84cc16',
    properties: [
      { key: 'versioning', label: 'Versioning', type: 'select', options: ['true', 'false'] },
      { key: 'replication', label: 'Replication', type: 'select', options: ['single', 'cross-region'] },
    ],
  },
  queue: {
    type: 'queue',
    label: 'Queue',
    color: '#f59e0b',
    properties: [
      { key: 'type', label: 'Queue Type', type: 'select', options: ['fifo', 'priority', 'pubsub'] },
      { key: 'persistence', label: 'Persistent', type: 'select', options: ['true', 'false'] },
      { key: 'maxSize', label: 'Max Size', type: 'number' },
    ],
  },
  eventStream: {
    type: 'eventStream',
    label: 'Event Stream',
    color: '#a855f7',
    properties: [
      { key: 'partitions', label: 'Partitions', type: 'number' },
      { key: 'retention', label: 'Retention', type: 'text' },
    ],
  },
  workflow: {
    type: 'workflow',
    label: 'Workflow',
    color: '#ec4899',
    properties: [
      { key: 'type', label: 'Type', type: 'select', options: ['orchestration', 'choreography'] },
      { key: 'durability', label: 'Durable', type: 'select', options: ['true', 'false'] },
    ],
  },
  scheduler: {
    type: 'scheduler',
    label: 'Scheduler',
    color: '#64748b',
    properties: [
      { key: 'schedule', label: 'Schedule (cron)', type: 'text' },
      { key: 'timezone', label: 'Timezone', type: 'text' },
    ],
  },
  notification: {
    type: 'notification',
    label: 'Notifications',
    color: '#f43f5e',
    properties: [
      { key: 'channels', label: 'Channels', type: 'text' },
    ],
  },
};

// Ordered list for palette display
export const PALETTE_ORDER: CloudNodeType[] = [
  'client',
  'apiGateway',
  'loadBalancer',
  'cdn',
  'service',
  'serverlessFunction',
  'container',
  'database',
  'cache',
  'blobStorage',
  'queue',
  'eventStream',
  'workflow',
  'scheduler',
  'notification',
];

// Helper to get label for a node type
export function getComponentLabel(type: CloudNodeType): string {
  return COMPONENT_REGISTRY[type]?.label ?? type;
}

// Helper to get color for a node type
export function getComponentColor(type: CloudNodeType): string {
  return COMPONENT_REGISTRY[type]?.color ?? '#6b7280';
}

// Helper to get properties for a node type
export function getComponentProperties(type: CloudNodeType): PropertyField[] {
  return COMPONENT_REGISTRY[type]?.properties ?? [];
}
