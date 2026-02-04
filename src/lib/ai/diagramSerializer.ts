import { CloudNode, DiagramEdge, CloudNodeType, DiagramNotes } from '@/types/diagram';
import { getComponentLabel } from '@/lib/components/registry';

// Get node details as string
function getNodeDetails(node: CloudNode): string {
  const parts: string[] = [];
  const data = node.data;
  const type = node.type as CloudNodeType;

  // Add type-specific details
  switch (type) {
    case 'loadBalancer':
      if ('algorithm' in data && data.algorithm) parts.push(`algorithm: ${data.algorithm}`);
      if ('healthCheck' in data && data.healthCheck) parts.push(`health check: ${data.healthCheck}`);
      break;
    case 'service':
      if ('technology' in data && data.technology) parts.push(`technology: ${data.technology}`);
      if ('instances' in data && data.instances) parts.push(`${data.instances} instances`);
      break;
    case 'database':
      if ('type' in data && data.type) parts.push(String(data.type));
      if ('engine' in data && data.engine) parts.push(`engine: ${data.engine}`);
      if ('replication' in data && data.replication && data.replication !== 'none') parts.push(String(data.replication));
      break;
    case 'queue':
      if ('type' in data && data.type) parts.push(String(data.type));
      if ('persistence' in data && data.persistence !== undefined) parts.push(data.persistence ? 'persistent' : 'in-memory');
      break;
    case 'cache':
      if ('strategy' in data && data.strategy) parts.push(`strategy: ${data.strategy}`);
      if ('eviction' in data && data.eviction) parts.push(`eviction: ${data.eviction}`);
      break;
    case 'client':
      if ('type' in data && data.type) parts.push(String(data.type));
      break;
    case 'serverlessFunction':
      if ('runtime' in data && data.runtime) parts.push(`runtime: ${data.runtime}`);
      if ('timeout' in data && data.timeout) parts.push(`timeout: ${data.timeout}s`);
      break;
    case 'container':
      if ('orchestrator' in data && data.orchestrator) parts.push(String(data.orchestrator));
      if ('replicas' in data && data.replicas) parts.push(`${data.replicas} replicas`);
      break;
    case 'blobStorage':
      if ('replication' in data && data.replication) parts.push(String(data.replication));
      break;
    case 'cdn':
      if ('caching' in data && data.caching) parts.push(`caching: ${data.caching}`);
      break;
    case 'eventStream':
      if ('partitions' in data && data.partitions) parts.push(`${data.partitions} partitions`);
      if ('retention' in data && data.retention) parts.push(`retention: ${data.retention}`);
      break;
    case 'workflow':
      if ('type' in data && data.type) parts.push(String(data.type));
      if ('durability' in data && data.durability) parts.push('durable');
      break;
    case 'notification':
      if ('channels' in data && data.channels && Array.isArray(data.channels)) parts.push(`channels: ${(data.channels as string[]).join(', ')}`);
      break;
    case 'scheduler':
      if ('schedule' in data && data.schedule) parts.push(`schedule: ${data.schedule}`);
      break;
    case 'apiGateway':
      if ('authentication' in data && data.authentication) parts.push(`auth: ${data.authentication}`);
      if ('rateLimit' in data && data.rateLimit) parts.push(`rate limit: ${data.rateLimit}/s`);
      break;
  }

  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

// Get Mermaid shape for node type
function getMermaidShape(nodeType: CloudNodeType): [string, string] {
  switch (nodeType) {
    case 'database':
    case 'blobStorage':
      return ['[(', ')]']; // cylinder
    case 'queue':
    case 'eventStream':
      return ['[[', ']]']; // subroutine shape
    case 'cache':
      return ['((', '))']; // circle
    case 'loadBalancer':
    case 'apiGateway':
    case 'cdn':
      return ['{{', '}}']; // hexagon
    case 'client':
      return ['[/', '\\]']; // parallelogram
    case 'serverlessFunction':
      return ['>', ']']; // asymmetric
    case 'scheduler':
    case 'workflow':
      return ['([', '])'];  // stadium shape
    case 'notification':
      return ['(((', ')))'];  // double circle
    default:
      return ['[', ']']; // rectangle
  }
}

interface SerializeOptions {
  selectedNodeIds?: string[];
  includeEdgeIds?: boolean;  // For flow simulation - includes edge IDs in diagram
  includeDetails?: boolean;  // Include component details section
}

/**
 * Core Mermaid serialization - shared between AI chat and flow simulation
 */
function serializeToMermaid(
  nodes: CloudNode[],
  edges: DiagramEdge[],
  options: SerializeOptions = {}
): string {
  const { selectedNodeIds = [], includeEdgeIds = false, includeDetails = true } = options;
  const selectedIds = new Set(selectedNodeIds);

  if (nodes.length === 0) {
    return 'The diagram is currently empty.';
  }

  const lines: string[] = ['```mermaid', 'flowchart LR'];

  // Define nodes with their labels and types
  for (const node of nodes) {
    const type = getComponentLabel(node.type as CloudNodeType);
    const label = `${node.data.label}\\n(${type})`;
    const isSelected = selectedIds.has(node.id);
    const shape = getMermaidShape(node.type as CloudNodeType);

    lines.push(`    ${node.id}${shape[0]}"${label}"${shape[1]}`);

    // Mark selected node with special styling
    if (isSelected) {
      lines.push(`    style ${node.id} stroke:#f00,stroke-width:3px`);
    }
  }

  // Define edges (with optional edge IDs for flow simulation)
  for (const edge of edges) {
    let edgeLabel = '';

    // Include edge ID if requested (for flow simulation)
    if (includeEdgeIds) {
      edgeLabel = edge.id;
    }

    if (edge.data?.label) {
      edgeLabel += edgeLabel ? `: ${edge.data.label}` : edge.data.label;
    }
    if (edge.data?.async) {
      edgeLabel += edgeLabel ? ' (async)' : 'async';
    }

    const arrow = edge.animated ? '-.->' : '-->';
    if (edgeLabel) {
      lines.push(`    ${edge.source} ${arrow}|"${edgeLabel}"| ${edge.target}`);
    } else {
      lines.push(`    ${edge.source} ${arrow} ${edge.target}`);
    }
  }

  lines.push('```');

  // Add component details as structured data
  if (includeDetails) {
    lines.push('\n## Component Details\n');
    for (const node of nodes) {
      const type = getComponentLabel(node.type as CloudNodeType);
      const details = getNodeDetails(node);
      const isSelected = selectedIds.has(node.id);
      const marker = isSelected ? ' **[SELECTED]**' : '';

      lines.push(`- **${node.data.label}**${marker}: ${type}${details}`);
      if (node.data.description) {
        lines.push(`  - Description: ${node.data.description}`);
      }
      if (node.data.notes) {
        lines.push(`  - Notes: ${node.data.notes}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Serialize diagram for AI chat - includes Mermaid + component details
 */
export function serializeDiagramForAI(
  nodes: CloudNode[],
  edges: DiagramEdge[],
  selectedNodeIds?: string | string[]
): string {
  // Normalize selectedNodeIds to an array
  const normalizedIds = selectedNodeIds
    ? Array.isArray(selectedNodeIds)
      ? selectedNodeIds
      : [selectedNodeIds]
    : [];

  return serializeToMermaid(nodes, edges, {
    selectedNodeIds: normalizedIds,
    includeEdgeIds: false,
    includeDetails: true,
  });
}

/**
 * Serialize diagram for flow simulation - includes edge IDs for step mapping
 */
export function serializeDiagramForFlow(
  nodes: CloudNode[],
  edges: DiagramEdge[]
): string {
  const mermaid = serializeToMermaid(nodes, edges, {
    includeEdgeIds: true,
    includeDetails: true,
  });

  // Add explicit instructions for the LLM about using IDs
  const instructions = `
## Instructions

Use the node IDs (e.g., "1", "2") and edge IDs (e.g., "e1-2") shown in the diagram above when generating flow steps.
The edge ID appears as the label on each connection in the Mermaid diagram.`;

  return mermaid + instructions;
}

/**
 * Serialize only selected node(s) for focused questions
 */
export function serializeSelectedNode(node: CloudNode): string {
  const type = getComponentLabel(node.type as CloudNodeType);
  const details = getNodeDetails(node);

  const lines: string[] = [
    `**${node.data.label}** (${type})${details}`,
  ];

  if (node.data.description) {
    lines.push(`- Description: ${node.data.description}`);
  }
  if (node.data.notes) {
    lines.push(`- Notes: ${node.data.notes}`);
  }

  return lines.join('\n');
}

/**
 * Serialize notes for AI context
 * Problem Statement is emphasized as the primary context for evaluation
 */
export function serializeNotesForAI(notes: DiagramNotes): string {
  const lines: string[] = [];

  // Problem Statement comes first and is emphasized
  const problemSection = notes.sections.find(s => s.id === 'problem');
  if (problemSection?.content.trim()) {
    lines.push('## System Being Designed');
    lines.push(problemSection.content.trim());
    lines.push('');
    lines.push('This is the PRIMARY CONTEXT for evaluating the architecture.');
    lines.push('');
  }

  // Then other sections with content
  const otherSections = notes.sections.filter(s => s.id !== 'problem' && s.content.trim());
  if (otherSections.length > 0) {
    lines.push('## Design Notes\n');
    for (const section of otherSections) {
      lines.push(`### ${section.title}`);
      lines.push(section.content.trim());
      lines.push('');
    }
  }

  return lines.join('\n');
}
