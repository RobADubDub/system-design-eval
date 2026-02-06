'use client';

import ELK from 'elkjs/lib/elk.bundled.js';
import { useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { BenchmarkInsight, BenchmarkProfile, InsightFacet, InsightStatus, ReferenceGraph } from '@/types/benchmark';
import { CloudNode, CloudNodeType, DiagramEdge } from '@/types/diagram';
import {
  ApiGatewayNode,
  BlobStorageNode,
  CacheNode,
  CdnNode,
  ClientNode,
  ContainerNode,
  DatabaseNode,
  EventStreamNode,
  LoadBalancerNode,
  NotificationNode,
  QueueNode,
  SchedulerNode,
  ServerlessFunctionNode,
  ServiceNode,
  TextNode,
  WorkflowNode,
} from '@/components/nodes';
import { EditingProvider } from '@/components/nodes/EditingContext';

interface BenchmarkFullCompareProps {
  profile: BenchmarkProfile;
  referenceGraph: ReferenceGraph;
  insights: BenchmarkInsight[];
  onClose: () => void;
}

const FACET_OPTIONS: Array<{ value: 'all' | InsightFacet; label: string }> = [
  { value: 'all', label: 'All facets' },
  { value: 'scale', label: 'Scale' },
  { value: 'operational', label: 'Operational' },
  { value: 'reliability', label: 'Reliability' },
  { value: 'cost', label: 'Cost' },
  { value: 'complexity', label: 'Complexity' },
];

const nodeTypes = {
  loadBalancer: LoadBalancerNode,
  service: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  client: ClientNode,
  cache: CacheNode,
  serverlessFunction: ServerlessFunctionNode,
  container: ContainerNode,
  blobStorage: BlobStorageNode,
  cdn: CdnNode,
  eventStream: EventStreamNode,
  workflow: WorkflowNode,
  notification: NotificationNode,
  scheduler: SchedulerNode,
  apiGateway: ApiGatewayNode,
  text: TextNode,
};

export function BenchmarkFullCompare({ profile, referenceGraph, insights, onClose }: BenchmarkFullCompareProps) {
  const [activeFacet, setActiveFacet] = useState<'all' | InsightFacet>('all');
  const [hoveredInsightId, setHoveredInsightId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [elkGraph, setElkGraph] = useState<ReferenceGraph | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setIsLayouting(true);
      try {
        const laidOut = await createElkLayout(referenceGraph);
        if (!isCancelled) {
          setElkGraph(laidOut);
        }
      } catch (error) {
        // Fallback to deterministic heuristic if ELK fails.
        if (!isCancelled) {
          setElkGraph(createTidyLayout(referenceGraph));
        }
        console.warn('ELK layout failed, using fallback tidy layout.', error);
      } finally {
        if (!isCancelled) {
          setIsLayouting(false);
        }
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [referenceGraph]);

  const filteredInsights = useMemo(
    () => insights.filter((insight) => activeFacet === 'all' || insight.facet === activeFacet),
    [insights, activeFacet]
  );

  const highlightedNodeIds = useMemo(() => {
    if (hoveredInsightId) {
      const insight = filteredInsights.find((item) => item.id === hoveredInsightId);
      return new Set(insight?.referenceNodeIds || []);
    }
    if (hoveredNodeId) {
      return new Set([hoveredNodeId]);
    }
    return new Set<string>();
  }, [hoveredInsightId, hoveredNodeId, filteredInsights]);

  const highlightedInsightIds = useMemo(() => {
    if (hoveredNodeId) {
      return new Set(
        filteredInsights.filter((insight) => insight.referenceNodeIds.includes(hoveredNodeId)).map((insight) => insight.id)
      );
    }
    if (hoveredInsightId) {
      return new Set([hoveredInsightId]);
    }
    return new Set<string>();
  }, [hoveredNodeId, hoveredInsightId, filteredInsights]);

  const positionedGraph = useMemo(
    () => elkGraph || createTidyLayout(referenceGraph),
    [referenceGraph, elkGraph]
  );

  const flowNodes = useMemo<CloudNode[]>(
    () =>
      positionedGraph.nodes.map((node) => {
        const primaryFacet = Object.values(node.facets)[0] || 'Reference architecture component.';
        const isHighlighted = highlightedNodeIds.has(node.id);
        const dimmed = highlightedNodeIds.size > 0 && !isHighlighted;
        return {
          id: node.id,
          type: node.type as CloudNodeType,
          position: { x: node.x, y: node.y },
          data: {
            label: node.label,
            description: primaryFacet,
            notes: `Type: ${node.type}`,
            isActive: isHighlighted,
          },
          selected: isHighlighted,
          draggable: false,
          selectable: false,
          connectable: false,
          style: dimmed ? { opacity: 0.35 } : { opacity: 1 },
        };
      }),
    [positionedGraph.nodes, highlightedNodeIds]
  );

  const flowEdges = useMemo<DiagramEdge[]>(
    () =>
      positionedGraph.edges.map((edge) => {
        const connected = hoveredNodeId
          ? edge.source === hoveredNodeId || edge.target === hoveredNodeId
          : false;

        const style = hoveredNodeId
          ? connected
            ? { stroke: '#2563eb', strokeWidth: 2.8 }
            : { stroke: '#cbd5e1', strokeWidth: 1.2, opacity: 0.35 }
          : { stroke: '#cbd5e1', strokeWidth: 1.6 };

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: hoveredNodeId ? connected : false,
          style,
          data: edge.label ? { label: edge.label } : undefined,
        };
      }),
    [positionedGraph.edges, hoveredNodeId]
  );

  return (
    <div className="absolute inset-0 z-40 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Full Architecture Compare</h2>
          <p className="text-xs text-gray-500">Profile: {profile.replace('_', ' ')}</p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Exit compare
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(640px,1fr)_420px]">
        <section className="border-r border-gray-200 bg-gray-50 min-h-0 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-medium text-gray-800">Reference Design</h3>
            <p className="text-xs text-gray-500 mt-1">
              Hover a component to see its key tradeoff notes. Hover an insight on the right to highlight related components.
            </p>
            {isLayouting && (
              <p className="text-[11px] text-gray-500 mt-1">Computing ELK layout...</p>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="h-[min(72vh,720px)] min-h-[420px] rounded-lg border border-gray-200 bg-white overflow-hidden">
              <EditingProvider>
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.3}
                    maxZoom={1.8}
                    panOnDrag
                    zoomOnScroll
                    elementsSelectable={false}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
                    onNodeMouseLeave={() => setHoveredNodeId(null)}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </ReactFlowProvider>
              </EditingProvider>
            </div>
          </div>
        </section>

        <section className="min-h-0 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Difference Notes</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {FACET_OPTIONS.map((facet) => (
                <button
                  key={facet.value}
                  onClick={() => setActiveFacet(facet.value)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeFacet === facet.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {facet.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {filteredInsights.map((insight) => (
              <article
                key={insight.id}
                onMouseEnter={() => setHoveredInsightId(insight.id)}
                onMouseLeave={() => setHoveredInsightId(null)}
                className={`border rounded p-3 bg-white transition-colors ${
                  highlightedInsightIds.has(insight.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${statusBadgeClass(insight.status)}`}>
                    {insight.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 uppercase">{insight.facet}</p>
                <p className="text-sm text-gray-700 mt-1">{insight.summary}</p>
                <p className="text-sm text-gray-600 mt-1">{insight.detail}</p>
              </article>
            ))}
            {filteredInsights.length === 0 && (
              <p className="text-sm text-gray-500">No insights for this facet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function statusBadgeClass(status: InsightStatus): string {
  switch (status) {
    case 'aligned':
      return 'bg-green-100 text-green-700';
    case 'partial':
      return 'bg-amber-100 text-amber-800';
    case 'missing':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

const NODE_WIDTH = 112;
const NODE_HEIGHT = 76;
const PAD_X = 36;
const PAD_Y = 36;
const COLLISION_GAP = 18;
const BASE_COL_GAP = 162;
const BASE_ROW_GAP = 104;

function laneIndex(type: string): number {
  switch (type) {
    case 'client':
    case 'cdn':
    case 'apiGateway':
      return 0;
    case 'loadBalancer':
      return 1;
    case 'service':
    case 'container':
    case 'serverlessFunction':
    case 'workflow':
      return 2;
    case 'queue':
    case 'eventStream':
    case 'notification':
    case 'scheduler':
      return 3;
    case 'cache':
    case 'database':
    case 'blobStorage':
      return 4;
    default:
      return 2;
  }
}

async function createElkLayout(referenceGraph: ReferenceGraph): Promise<ReferenceGraph> {
  if (referenceGraph.nodes.length === 0) return referenceGraph;

  const elk = new ELK();
  const sourceNodeIds = new Set(referenceGraph.nodes.map((node) => node.id));

  const elkInput = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '32',
      'elk.layered.spacing.nodeNodeBetweenLayers': '68',
      'elk.layered.spacing.edgeNodeBetweenLayers': '16',
      'elk.padding': '[top=24,left=24,bottom=24,right=24]',
    },
    children: referenceGraph.nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: referenceGraph.edges
      .filter((edge) => sourceNodeIds.has(edge.source) && sourceNodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
  };

  const laidOut = await elk.layout(elkInput);
  const laidOutChildren = laidOut.children || [];

  if (laidOutChildren.length === 0) {
    return referenceGraph;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  laidOutChildren.forEach((node) => {
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
  });

  const offsetX = Number.isFinite(minX) ? minX : 0;
  const offsetY = Number.isFinite(minY) ? minY : 0;

  const positions = new Map<string, { x: number; y: number }>();
  laidOutChildren.forEach((node) => {
    if (!node.id) return;
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    positions.set(node.id, {
      x: Math.round(PAD_X + (x - offsetX)),
      y: Math.round(PAD_Y + (y - offsetY)),
    });
  });

  return {
    nodes: referenceGraph.nodes.map((node) => {
      const pos = positions.get(node.id);
      return pos ? { ...node, x: pos.x, y: pos.y } : node;
    }),
    edges: referenceGraph.edges,
  };
}

function createTidyLayout(referenceGraph: ReferenceGraph): ReferenceGraph {
  if (referenceGraph.nodes.length === 0) return referenceGraph;
  const nodeCount = referenceGraph.nodes.length;

  const nodesById = new Map(referenceGraph.nodes.map((node) => [node.id, node]));
  const indegree = new Map(referenceGraph.nodes.map((node) => [node.id, 0]));
  const out = new Map<string, string[]>();

  referenceGraph.edges.forEach((edge) => {
    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) return;
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
    const list = out.get(edge.source) || [];
    list.push(edge.target);
    out.set(edge.source, list);
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  const depth = new Map<string, number>(referenceGraph.nodes.map((node) => [node.id, 0]));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    visited.add(id);
    const next = out.get(id) || [];
    next.forEach((targetId) => {
      const candidateDepth = (depth.get(id) || 0) + 1;
      depth.set(targetId, Math.max(depth.get(targetId) || 0, candidateDepth));
      const deg = (indegree.get(targetId) || 0) - 1;
      indegree.set(targetId, deg);
      if (deg === 0) queue.push(targetId);
    });
  }

  const estimatedDepth = Math.max(...Array.from(depth.values()), 0) + 1;
  const depthCompactness = estimatedDepth >= 6 ? 0.86 : estimatedDepth <= 3 ? 0.98 : 0.92;
  const colGap = Math.max(132, Math.round(BASE_COL_GAP * depthCompactness));
  const rowGap = Math.max(94, Math.round(BASE_ROW_GAP * (nodeCount > 14 ? 0.94 : 1)));

  // Cycle fallback: place unvisited nodes in nearest sensible depth.
  referenceGraph.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      depth.set(node.id, Math.max(0, Math.round(node.x / Math.max(colGap, 1))));
    }
  });

  const nodes = [...referenceGraph.nodes].sort((a, b) => {
    const depthDelta = (depth.get(a.id) || 0) - (depth.get(b.id) || 0);
    if (depthDelta !== 0) return depthDelta;
    const laneDelta = laneIndex(a.type) - laneIndex(b.type);
    if (laneDelta !== 0) return laneDelta;
    return a.y - b.y;
  });

  // Layer nodes by depth, then reduce crossings with barycenter sweeps.
  const layers = new Map<number, string[]>();
  nodes.forEach((node) => {
    const d = depth.get(node.id) || 0;
    const current = layers.get(d) || [];
    current.push(node.id);
    layers.set(d, current);
  });

  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  referenceGraph.edges.forEach((edge) => {
    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) return;
    incoming.set(edge.target, [...(incoming.get(edge.target) || []), edge.source]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  });

  const orderedDepths = Array.from(layers.keys()).sort((a, b) => a - b);
  const nodeRank = new Map<string, number>();
  const syncRanks = () => {
    orderedDepths.forEach((d) => {
      (layers.get(d) || []).forEach((id, idx) => nodeRank.set(id, idx));
    });
  };

  // Initial order: lane hint + original y.
  orderedDepths.forEach((d) => {
    const ordered = (layers.get(d) || []).sort((aId, bId) => {
      const a = nodesById.get(aId)!;
      const b = nodesById.get(bId)!;
      const laneDelta = laneIndex(a.type) - laneIndex(b.type);
      if (laneDelta !== 0) return laneDelta;
      return a.y - b.y;
    });
    layers.set(d, ordered);
  });
  syncRanks();

  const reorderLayer = (d: number, direction: 'forward' | 'backward') => {
    const layer = layers.get(d);
    if (!layer || layer.length <= 1) return;

    const scored = layer.map((id, index) => {
      const neighbors = direction === 'forward'
        ? incoming.get(id) || []
        : outgoing.get(id) || [];

      const barycenter = neighbors.length > 0
        ? neighbors.reduce((sum, neighborId) => sum + (nodeRank.get(neighborId) ?? 0), 0) / neighbors.length
        : index;

      // Small lane bias keeps domains semantically grouped without huge separation.
      const laneBias = laneIndex(nodesById.get(id)!.type) * 0.08;
      return { id, value: barycenter + laneBias };
    });

    scored.sort((a, b) => a.value - b.value);
    layers.set(d, scored.map((item) => item.id));
    syncRanks();
  };

  for (let pass = 0; pass < 4; pass += 1) {
    for (let i = 1; i < orderedDepths.length; i += 1) {
      reorderLayer(orderedDepths[i], 'forward');
    }
    for (let i = orderedDepths.length - 2; i >= 0; i -= 1) {
      reorderLayer(orderedDepths[i], 'backward');
    }
  }

  const placed: ReferenceGraph['nodes'] = [];
  orderedDepths.forEach((d) => {
    const ids = layers.get(d) || [];
    ids.forEach((id, row) => {
      const node = nodesById.get(id)!;
      placed.push({
        ...node,
        x: PAD_X + d * colGap,
        y: PAD_Y + row * rowGap,
      });
    });
  });

  // Collision pass: nudge overlapping nodes down.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        const overlapX = Math.abs(a.x - b.x) < NODE_WIDTH + COLLISION_GAP;
        const overlapY = Math.abs(a.y - b.y) < NODE_HEIGHT + COLLISION_GAP;
        if (overlapX && overlapY) {
          if (a.y <= b.y) {
            b.y += NODE_HEIGHT + COLLISION_GAP;
          } else {
            a.y += NODE_HEIGHT + COLLISION_GAP;
          }
        }
      }
    }
  }

  return {
    nodes: placed,
    edges: referenceGraph.edges,
  };
}
