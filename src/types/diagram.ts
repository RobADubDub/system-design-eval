import { Node, Edge } from '@xyflow/react';
import { NotesAssistState } from './notesAssist';

// ============================================
// Specification Types (Linked Annotations)
// ============================================

// A single specification item (bullet point)
export interface SpecItem {
  id: string;
  text: string;
  children: SpecItem[];  // Nested bullets
}

// Specification attached to a node
export interface NodeSpecification {
  nodeId: string;
  items: SpecItem[];
  // Position relative to parent node (offset)
  offsetX: number;
  offsetY: number;
  // Display state
  collapsed: boolean;
}

// Generate unique ID for spec items
export function generateSpecItemId(): string {
  return `spec-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create empty specification for a node
// Position centered below the node (node is ~70x60)
export function createEmptySpecification(nodeId: string): NodeSpecification {
  return {
    nodeId,
    items: [
      {
        id: generateSpecItemId(),
        text: '',
        children: [],
      },
    ],
    offsetX: -55,  // Center a ~180px box below a ~70px node
    offsetY: 80,   // Below the node
    collapsed: false,
  };
}

// Flatten spec items to count total items including nested
function flattenSpecItems(items: SpecItem[]): SpecItem[] {
  const result: SpecItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children.length > 0) {
      result.push(...flattenSpecItems(item.children));
    }
  }
  return result;
}

// Calculate how many levels to show based on available height
export function calculateVisibleLevels(
  items: SpecItem[],
  availableHeight: number,
  lineHeight: number = 24
): { visibleItems: SpecItem[], hiddenCount: number } {
  const allItems = flattenSpecItems(items);
  const maxItems = Math.floor(availableHeight / lineHeight);

  if (maxItems >= allItems.length) {
    return { visibleItems: items, hiddenCount: 0 };
  }

  // Show only first-level items when space is tight
  const firstLevelOnly = items.map(item => ({
    ...item,
    children: [],
  }));

  const visibleFirstLevel = firstLevelOnly.slice(0, maxItems);
  const hiddenCount = allItems.length - visibleFirstLevel.length;

  return { visibleItems: visibleFirstLevel, hiddenCount };
}

// ============================================
// Node dimensions for positioning calculations
// Width matches min-w-[70px] in BaseNode.tsx
// Height based on: py-2 (16px) + icon (24px) + gap (4px) + label (~16px) ≈ 60px
export const NODE_DIMENSIONS = {
  minWidth: 70,   // Matches min-w-[70px] in BaseNode - used for drop centering
  height: 60,     // Approximate height including padding and content
} as const;

// Base data that all nodes share
export interface BaseNodeData {
  label: string;
  description?: string; // What this component does / its role in the system
  notes?: string;       // Additional notes, constraints, considerations
  [key: string]: unknown;
}

// Specific node data types
export interface LoadBalancerData extends BaseNodeData {
  algorithm?: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted';
  healthCheck?: string;
  targets?: string[];
}

export interface ServiceData extends BaseNodeData {
  instances?: number;
  technology?: string;
  endpoints?: string[];
}

export interface DatabaseData extends BaseNodeData {
  type?: 'sql' | 'nosql' | 'graph' | 'timeseries' | 'cache';
  engine?: string;
  replication?: 'none' | 'primary-replica' | 'multi-master';
}

export interface QueueData extends BaseNodeData {
  type?: 'fifo' | 'priority' | 'pubsub';
  persistence?: boolean;
  maxSize?: number;
}

export interface ClientData extends BaseNodeData {
  type?: 'web' | 'mobile' | 'iot' | 'api';
}

export interface CacheData extends BaseNodeData {
  strategy?: 'write-through' | 'write-back' | 'write-around';
  eviction?: 'lru' | 'lfu' | 'ttl';
}

export interface ServerlessFunctionData extends BaseNodeData {
  runtime?: string;
  timeout?: number;
  memory?: number;
}

export interface ContainerData extends BaseNodeData {
  image?: string;
  replicas?: number;
  orchestrator?: 'kubernetes' | 'ecs' | 'docker-compose';
}

export interface BlobStorageData extends BaseNodeData {
  versioning?: boolean;
  replication?: 'single' | 'cross-region';
}

export interface CdnData extends BaseNodeData {
  origins?: string[];
  caching?: 'aggressive' | 'standard' | 'minimal';
}

export interface StreamingBrokerData extends BaseNodeData {
  partitions?: number;
  retention?: string;
}

export interface WorkflowData extends BaseNodeData {
  type?: 'orchestration' | 'choreography';
  durability?: boolean;
}

export interface NotificationData extends BaseNodeData {
  channels?: ('push' | 'email' | 'sms' | 'webhook')[];
}

export interface SchedulerData extends BaseNodeData {
  schedule?: string;
  timezone?: string;
}

export interface ApiGatewayData extends BaseNodeData {
  rateLimit?: number;
  authentication?: 'jwt' | 'api-key' | 'oauth' | 'none';
}

// Union type for all node data
export type CloudNodeData =
  | LoadBalancerData
  | ServiceData
  | DatabaseData
  | QueueData
  | ClientData
  | CacheData
  | ServerlessFunctionData
  | ContainerData
  | BlobStorageData
  | CdnData
  | StreamingBrokerData
  | WorkflowData
  | NotificationData
  | SchedulerData
  | ApiGatewayData;

// Node type identifiers
export type CloudNodeType =
  | 'loadBalancer'
  | 'service'
  | 'database'
  | 'queue'
  | 'client'
  | 'cache'
  | 'serverlessFunction'
  | 'container'
  | 'blobStorage'
  | 'cdn'
  | 'streamingBroker'
  | 'workflow'
  | 'notification'
  | 'scheduler'
  | 'apiGateway';

// Typed node
export type CloudNode = Node<CloudNodeData, CloudNodeType>;

// Edge with optional metadata
export interface DiagramEdge extends Edge {
  data?: {
    label?: string;
    protocol?: string;
    async?: boolean;
  };
}

// Full diagram state
export interface DiagramState {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  specifications?: NodeSpecification[];  // Linked annotations
}

// Notes section for structured documentation
export interface NotesSection {
  id: string;
  title: string;
  content: string;
  collapsed: boolean;
}

export interface DiagramNotes {
  sections: NotesSection[];
}

// Default problem statement matching the initial diagram
const DEFAULT_PROBLEM_STATEMENT = `Design an e-commerce order management system that handles user authentication, order processing, and real-time notifications.

The system should support user sessions, shopping cart management, and asynchronous order fulfillment with event-driven architecture.`;

// Default sections matching system design interview flow
export const DEFAULT_NOTES_SECTIONS: NotesSection[] = [
  { id: 'problem', title: 'Problem', content: DEFAULT_PROBLEM_STATEMENT, collapsed: false },  // Always expanded, sets context
  { id: 'functional', title: 'Functional Reqs', content: '', collapsed: true },
  { id: 'workflows', title: 'Workflows', content: '', collapsed: true },
  { id: 'nonfunctional', title: 'Non-Functional Reqs', content: '', collapsed: true },
  { id: 'entities', title: 'Entities', content: '', collapsed: true },
  { id: 'apis', title: 'APIs', content: '', collapsed: true },
  { id: 'deepdives', title: 'Deep Dives', content: '', collapsed: true },
];

// Saved diagram format for persistence
export interface SavedDiagram {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: DiagramState;
  notes?: DiagramNotes;  // Optional for backwards compatibility
  notesAssist?: NotesAssistState;  // Optional for backwards compatibility
}

// Flow simulation types
export interface FlowStep {
  nodeId: string;
  edgeId?: string;
  description: string;
  duration: number; // milliseconds
}

export interface FlowSimulation {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
}
