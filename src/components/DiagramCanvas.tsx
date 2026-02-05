'use client';

import { useCallback, useRef, DragEvent, useState, KeyboardEvent, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  BackgroundVariant,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  LoadBalancerNode,
  ServiceNode,
  DatabaseNode,
  QueueNode,
  ClientNode,
  CacheNode,
  ServerlessFunctionNode,
  ContainerNode,
  BlobStorageNode,
  CdnNode,
  EventStreamNode,
  WorkflowNode,
  NotificationNode,
  SchedulerNode,
  ApiGatewayNode,
  TextNode,
} from './nodes';
import { getComponentLabel, getComponentColor } from '@/lib/components/registry';
import { EditingProvider, useEditing } from './nodes/EditingContext';
import { CloudNodeType, CloudNodeData, CloudNode, DiagramEdge, NODE_DIMENSIONS, NodeSpecification } from '@/types/diagram';
import { ContextMenu, ContextMenuProps } from './ContextMenu';
import { SpecificationsLayer } from './specifications';

// Register custom node types
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

// Default data for each node type - uses registry labels
const defaultNodeData: Record<CloudNodeType, CloudNodeData> = {
  client: { label: getComponentLabel('client') },
  loadBalancer: { label: getComponentLabel('loadBalancer') },
  service: { label: getComponentLabel('service') },
  database: { label: getComponentLabel('database') },
  queue: { label: getComponentLabel('queue') },
  cache: { label: getComponentLabel('cache') },
  serverlessFunction: { label: getComponentLabel('serverlessFunction') },
  container: { label: getComponentLabel('container') },
  blobStorage: { label: getComponentLabel('blobStorage') },
  cdn: { label: getComponentLabel('cdn') },
  eventStream: { label: getComponentLabel('eventStream') },
  workflow: { label: getComponentLabel('workflow') },
  notification: { label: getComponentLabel('notification') },
  scheduler: { label: getComponentLabel('scheduler') },
  apiGateway: { label: getComponentLabel('apiGateway') },
  text: { label: getComponentLabel('text') },
};

// Sample initial diagram - generic system design focused
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'client',
    position: { x: 50, y: 200 },
    data: { label: 'Client' },
  },
  {
    id: '2',
    type: 'loadBalancer',
    position: { x: 250, y: 200 },
    data: { label: 'API Gateway' },
  },
  {
    id: '3',
    type: 'service',
    position: { x: 450, y: 100 },
    data: { label: 'User Service', notes: 'Handles authentication and user profiles' },
  },
  {
    id: '4',
    type: 'service',
    position: { x: 450, y: 300 },
    data: { label: 'Order Service', notes: 'Manages orders and cart state' },
  },
  {
    id: '5',
    type: 'cache',
    position: { x: 650, y: 100 },
    data: { label: 'Session Cache', notes: 'User sessions and frequently accessed profiles' },
  },
  {
    id: '6',
    type: 'database',
    position: { x: 650, y: 300 },
    data: { label: 'Orders DB', notes: 'Persistent order data, needs ACID transactions' },
  },
  {
    id: '7',
    type: 'queue',
    position: { x: 450, y: 450 },
    data: { label: 'Event Bus', notes: 'Async order processing, notifications, analytics events' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
  { id: 'e4-6', source: '4', target: '6' },
  { id: 'e4-7', source: '4', target: '7' },
];

// Context menu state type
interface ContextMenuState {
  x: number;
  y: number;
  type: ContextMenuProps['type'];
  nodeId?: string;
  edgeId?: string;
}

// Props for the inner component when state is lifted
export interface DiagramCanvasProps {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  onNodesChange: (changes: NodeChange<CloudNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<DiagramEdge>[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<CloudNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<DiagramEdge[]>>;
  selectedNodes: CloudNode[];
  selectedEdges: DiagramEdge[];
  onSelectionChange: (params: OnSelectionChangeParams) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onAskAI?: (nodeId: string) => void;
  getNextNodeId: () => string;
  focusNodeId?: string | null;
  onHistoryCommit?: () => void;
  // Specifications
  specifications: NodeSpecification[];
  onAddSpecification?: (nodeId: string) => void;
  onUpdateSpecification?: (spec: NodeSpecification) => void;
  onDeleteSpecification?: (nodeId: string) => void;
}

// Methods exposed via ref
export interface DiagramCanvasHandle {
  centerView: () => void;
}

const DiagramCanvasInner = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(function DiagramCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  selectedNodes,
  selectedEdges,
  onSelectionChange,
  onNodeDoubleClick,
  onAskAI,
  getNextNodeId,
  focusNodeId,
  onHistoryCommit,
  specifications,
  onAddSpecification,
  onUpdateSpecification,
  onDeleteSpecification,
}, ref) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, deleteElements, setCenter, getZoom, fitView } = useReactFlow();

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerView: () => {
      if (nodes.length > 0) {
        const currentZoom = getZoom();
        fitView({ maxZoom: currentZoom, duration: 300 });
      }
    },
  }), [nodes.length, getZoom, fitView]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const isDragging = useRef(false);
  const { triggerEdit } = useEditing();
  const clipboardRef = useRef<{
    nodes: CloudNode[];
    edges: DiagramEdge[];
  } | null>(null);

  // Scroll detection for specification line visibility
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Focus on a node when focusNodeId changes
  useEffect(() => {
    if (focusNodeId) {
      const node = nodes.find((n) => n.id === focusNodeId);
      if (node) {
        // Center the view on the node
        const zoom = getZoom();
        setCenter(
          node.position.x + NODE_DIMENSIONS.minWidth / 2,
          node.position.y + NODE_DIMENSIONS.height / 2,
          { zoom, duration: 500 }
        );
      }
    }
  }, [focusNodeId, nodes, setCenter, getZoom]);

  const onConnect = useCallback(
    (params: Connection) => {
      onHistoryCommit?.();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, onHistoryCommit]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as CloudNodeType;

      if (!type || !reactFlowWrapper.current) {
        return;
      }

      const dropPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Center the node around the drop position
      const position = {
        x: dropPosition.x - NODE_DIMENSIONS.minWidth / 2,
        y: dropPosition.y - NODE_DIMENSIONS.height / 2,
      };

      const newNodeId = getNextNodeId();
      const newNode: CloudNode = {
        id: newNodeId,
        type,
        position,
        data: { ...defaultNodeData[type] },
        selected: true, // Select the new node
      };

      onHistoryCommit?.();
      // Deselect all existing nodes and add the new selected node
      setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), newNode] as CloudNode[]);
    },
    [setNodes, screenToFlowPosition, getNextNodeId, onHistoryCommit]
  );

  // Delete selected elements
  const handleDelete = useCallback(() => {
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      onHistoryCommit?.();
      deleteElements({
        nodes: selectedNodes,
        edges: selectedEdges,
      });
    }
  }, [selectedNodes, selectedEdges, deleteElements, onHistoryCommit]);

  // Duplicate selected nodes
  const handleDuplicate = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const newNodes = selectedNodes.map((node) => ({
      ...node,
      id: getNextNodeId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: false,
      data: { ...node.data },
    }));

    onHistoryCommit?.();
    setNodes((nds) => [...nds, ...newNodes]);
  }, [selectedNodes, setNodes, getNextNodeId, onHistoryCommit]);

  const handleCopy = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const connectedEdges = edges.filter(
      (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target)
    );
    clipboardRef.current = {
      nodes: selectedNodes.map((node) => ({
        ...node,
        selected: false,
        data: { ...node.data },
      })),
      edges: connectedEdges.map((edge) => ({ ...edge })),
    };
  }, [selectedNodes, edges]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) {
      return;
    }

    const offset = 40;
    const idMap = new Map<string, string>();
    const pastedNodes = clipboardRef.current.nodes.map((node) => {
      const newId = getNextNodeId();
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
        data: { ...node.data },
      };
    });

    const pastedEdges = clipboardRef.current.edges.map((edge) => ({
      ...edge,
      id: crypto.randomUUID(),
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
      selected: false,
    }));

    onHistoryCommit?.();
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...pastedNodes]);
    setEdges((eds) => [...eds, ...pastedEdges]);
  }, [getNextNodeId, onHistoryCommit, setNodes, setEdges]);

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Delete/Backspace - delete selected elements
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
      }

      // Ctrl/Cmd + D - duplicate
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        handleDuplicate();
      }

      // Ctrl/Cmd + C - copy selection
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        handleCopy();
      }

      // Ctrl/Cmd + V - paste selection
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        handlePaste();
      }

      // Enter - trigger inline label editing for selected node
      if (event.key === 'Enter' && selectedNodes.length === 1) {
        event.preventDefault();
        triggerEdit(selectedNodes[0].id);
      }
    },
    [handleDelete, handleDuplicate, handleCopy, handlePaste, selectedNodes, triggerEdit]
  );

  // Context menu handlers
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'node',
        nodeId: node.id,
      });
    },
    []
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'edge',
        edgeId: edge.id,
      });
    },
    []
  );

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    // Could add paste functionality here later
  }, []);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu?.nodeId) {
      onHistoryCommit?.();
      deleteElements({ nodes: [{ id: contextMenu.nodeId }] });
    } else if (contextMenu?.edgeId) {
      onHistoryCommit?.();
      deleteElements({ edges: [{ id: contextMenu.edgeId }] });
    }
  }, [contextMenu, deleteElements, onHistoryCommit]);

  const handleContextMenuDuplicate = useCallback(() => {
    if (contextMenu?.nodeId) {
      const node = nodes.find((n) => n.id === contextMenu.nodeId);
      if (node) {
        const newNode: CloudNode = {
          ...node,
          id: getNextNodeId(),
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: false,
          data: { ...node.data },
        };
        onHistoryCommit?.();
        setNodes((nds) => [...nds, newNode]);
      }
    }
  }, [contextMenu, nodes, setNodes, getNextNodeId, onHistoryCommit]);

  const handleContextMenuEdit = useCallback(() => {
    if (contextMenu?.nodeId && onNodeDoubleClick) {
      onNodeDoubleClick(contextMenu.nodeId);
    }
  }, [contextMenu, onNodeDoubleClick]);

  const handleContextMenuAskAI = useCallback(() => {
    if (contextMenu?.nodeId && onAskAI) {
      onAskAI(contextMenu.nodeId);
    }
  }, [contextMenu, onAskAI]);

  const handleContextMenuAddSpecification = useCallback(() => {
    if (contextMenu?.nodeId && onAddSpecification) {
      onAddSpecification(contextMenu.nodeId);
    }
  }, [contextMenu, onAddSpecification]);

  // Handle node double-click for editing
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(node.id);
    },
    [onNodeDoubleClick]
  );

  // Handle node drag start - commit history before dragging
  const handleNodeDragStart = useCallback(() => {
    if (!isDragging.current) {
      isDragging.current = true;
      onHistoryCommit?.();
    }
  }, [onHistoryCommit]);

  // Handle node drag stop - reset dragging flag
  const handleNodeDragStop = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onMove={handleScroll}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomActivationKeyCode="Meta"
        deleteKeyCode={null} // We handle delete ourselves
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          type: 'smoothstep',
          interactionWidth: 20, // Wider hit area for easier clicking
        }}
        edgesFocusable={true}
        edgesReconnectable={true}
      >
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={(node) => getComponentColor(node.type as CloudNodeType)}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
        />
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
      </ReactFlow>

      {/* Specifications Layer - rendered outside ReactFlow to avoid viewport transforms */}
      {specifications.length > 0 && onUpdateSpecification && onDeleteSpecification && (
        <SpecificationsLayer
          specifications={specifications}
          nodes={nodes}
          isScrolling={isScrolling}
          onUpdateSpecification={onUpdateSpecification}
          onDeleteSpecification={onDeleteSpecification}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onDelete={handleContextMenuDelete}
          onDuplicate={contextMenu.type === 'node' ? handleContextMenuDuplicate : undefined}
          onEdit={contextMenu.type === 'node' ? handleContextMenuEdit : undefined}
          onAskAI={contextMenu.type === 'node' ? handleContextMenuAskAI : undefined}
          onAddSpecification={contextMenu.type === 'node' && onAddSpecification ? handleContextMenuAddSpecification : undefined}
          hasSpecification={contextMenu.type === 'node' && contextMenu.nodeId ? specifications.some(s => s.nodeId === contextMenu.nodeId) : false}
        />
      )}
    </div>
  );
});

// Export types and defaults for external use
export { nodeTypes, defaultNodeData, initialNodes, initialEdges };

// Wrapper component that provides ReactFlowProvider and EditingProvider context
// Forwards ref to inner component for imperative methods
export const DiagramCanvas = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(
  function DiagramCanvas(props, ref) {
    return (
      <ReactFlowProvider>
        <EditingProvider>
          <DiagramCanvasInner ref={ref} {...props} />
        </EditingProvider>
      </ReactFlowProvider>
    );
  }
);
