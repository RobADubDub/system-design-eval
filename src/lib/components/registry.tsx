import React from 'react';
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
  icon: React.ReactNode;
  properties: PropertyField[];
}

// Single source of truth for all component metadata
export const COMPONENT_REGISTRY: Record<CloudNodeType, ComponentMeta> = {
  client: {
    type: 'client',
    label: 'Client',
    color: '#6366f1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
      </svg>
    ),
    properties: [
      { key: 'type', label: 'Client Type', type: 'select', options: ['web', 'mobile', 'iot', 'api'] },
    ],
  },
  apiGateway: {
    type: 'apiGateway',
    label: 'API Gateway',
    color: '#7c3aed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
        <path d="M8 10h.01" strokeLinecap="round" />
        <path d="M12 10h.01" strokeLinecap="round" />
        <path d="M16 10h.01" strokeLinecap="round" />
        <path d="M8 14h8" strokeLinecap="round" />
      </svg>
    ),
    properties: [
      { key: 'authentication', label: 'Auth Method', type: 'select', options: ['jwt', 'api-key', 'oauth', 'none'] },
      { key: 'rateLimit', label: 'Rate Limit (/s)', type: 'number' },
    ],
  },
  loadBalancer: {
    type: 'loadBalancer',
    label: 'Load Balancer',
    color: '#8b5cf6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="12" />
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="6" y2="16" />
        <line x1="18" y1="12" x2="18" y2="16" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    properties: [
      { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['round-robin', 'least-connections', 'ip-hash', 'weighted'] },
      { key: 'healthCheck', label: 'Health Check', type: 'text' },
    ],
  },
  cdn: {
    type: 'cdn',
    label: 'CDN',
    color: '#06b6d4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    properties: [
      { key: 'caching', label: 'Caching', type: 'select', options: ['aggressive', 'standard', 'minimal'] },
    ],
  },
  service: {
    type: 'service',
    label: 'Service',
    color: '#3b82f6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
        <circle cx="7" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
    properties: [
      { key: 'instances', label: 'Instances', type: 'number' },
      { key: 'technology', label: 'Technology', type: 'text' },
    ],
  },
  serverlessFunction: {
    type: 'serverlessFunction',
    label: 'Function',
    color: '#f97316',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
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
    icon: (
      <img src="/icons/ContainerServiceIcon.png" width="20" height="20" alt="Container" />
    ),
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </svg>
    ),
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    properties: [
      { key: 'strategy', label: 'Strategy', type: 'select', options: ['write-through', 'write-back', 'write-around'] },
      { key: 'eviction', label: 'Eviction Policy', type: 'select', options: ['lru', 'lfu', 'ttl'] },
    ],
  },
  blobStorage: {
    type: 'blobStorage',
    label: 'Blob Storage',
    color: '#84cc16',
    icon: (
      <img src="/icons/BlobStorageIcon.png" width="20" height="20" alt="Blob Storage" />
    ),
    properties: [
      { key: 'versioning', label: 'Versioning', type: 'select', options: ['true', 'false'] },
      { key: 'replication', label: 'Replication', type: 'select', options: ['single', 'cross-region'] },
    ],
  },
  queue: {
    type: 'queue',
    label: 'Queue',
    color: '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="5" rx="1" />
        <rect x="3" y="10" width="18" height="5" rx="1" />
        <rect x="3" y="17" width="12" height="5" rx="1" />
        <path d="M18 19l2-2-2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h16" strokeLinecap="round" />
        <path d="M4 6h16" strokeLinecap="round" />
        <path d="M4 18h16" strokeLinecap="round" />
        <path d="M18 9l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 15l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    properties: [
      { key: 'partitions', label: 'Partitions', type: 'number' },
      { key: 'retention', label: 'Retention', type: 'text' },
    ],
  },
  workflow: {
    type: 'workflow',
    label: 'Workflow',
    color: '#ec4899',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="9" y="15" width="6" height="6" rx="1" />
        <path d="M9 6h6" strokeLinecap="round" />
        <path d="M6 9v3a3 3 0 0 0 3 3h0" strokeLinecap="round" />
        <path d="M18 9v3a3 3 0 0 1-3 3h0" strokeLinecap="round" />
      </svg>
    ),
    properties: [
      { key: 'type', label: 'Type', type: 'select', options: ['orchestration', 'choreography'] },
      { key: 'durability', label: 'Durable', type: 'select', options: ['true', 'false'] },
    ],
  },
  scheduler: {
    type: 'scheduler',
    label: 'Scheduler',
    color: '#64748b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    properties: [
      { key: 'schedule', label: 'Schedule (cron)', type: 'text' },
      { key: 'timezone', label: 'Timezone', type: 'text' },
    ],
  },
  text: {
    type: 'text',
    label: 'Text',
    color: '#6b7280',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
      </svg>
    ),
    properties: [],
  },
  notification: {
    type: 'notification',
    label: 'Notifications',
    color: '#f43f5e',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <path d="M22 8c0-1.1-.2-2.2-.5-3" strokeLinecap="round" />
        <path d="M2 8c0-1.1.2-2.2.5-3" strokeLinecap="round" />
      </svg>
    ),
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
  'text',
];

// Helper to get label for a node type
export function getComponentLabel(type: CloudNodeType): string {
  return COMPONENT_REGISTRY[type]?.label ?? type;
}

// Helper to get color for a node type
export function getComponentColor(type: CloudNodeType): string {
  return COMPONENT_REGISTRY[type]?.color ?? '#6b7280';
}

// Helper to get icon for a node type
export function getComponentIcon(type: CloudNodeType): React.ReactNode {
  return COMPONENT_REGISTRY[type]?.icon ?? null;
}

// Helper to get properties for a node type
export function getComponentProperties(type: CloudNodeType): PropertyField[] {
  return COMPONENT_REGISTRY[type]?.properties ?? [];
}
