'use client';

import { useState, useCallback, useRef, useEffect, MouseEvent, createRef } from 'react';
import { useNodesState, useEdgesState, OnSelectionChangeParams } from '@xyflow/react';
import { LeftPanel, LeftPanelTab } from '@/components/LeftPanel';
import { DiagramCanvas, DiagramCanvasHandle, initialNodes, initialEdges } from '@/components/DiagramCanvas';
import { NodePropertiesPanel } from '@/components/NodePropertiesPanel';
import { AIChatPanel, AIChatMode, NotesContext, ChatExchange, InitialMessage } from '@/components/ai/AIChatPanel';
import { FlowSimulator } from '@/components/FlowSimulator';
import { CloudNode, DiagramEdge, CloudNodeData, DiagramState, DiagramNotes, NodeSpecification, DEFAULT_NOTES_SECTIONS, createEmptySpecification } from '@/types/diagram';
import { ProblemTemplate } from '@/types/notesAssist';
import { useDiagramPersistence } from '@/hooks/useDiagramPersistence';
import { SettingsProvider, useSettings } from '@/components/settings/SettingsContext';
import { ModelSelector } from '@/components/settings/ModelSelector';

type RightPanelMode = 'none' | 'properties' | 'ai' | 'flow';

const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 320;
const MIN_LEFT_PANEL_WIDTH = 200;
const MAX_LEFT_PANEL_WIDTH = 400;
const DEFAULT_LEFT_PANEL_WIDTH = 224; // 14rem = 224px
const MAX_HISTORY = 50;

function HomeContent() {
  const { settings } = useSettings();
  // Node ID counter
  const nodeIdCounter = useRef(
    Math.max(...initialNodes.map((n) => parseInt(n.id, 10)), 0) + 1
  );
  const getNextNodeId = useCallback(() => String(nodeIdCounter.current++), []);
  const handleNodeIdReset = useCallback((maxId: number) => {
    nodeIdCounter.current = maxId + 1;
  }, []);

  // Diagram state - lifted from DiagramCanvas
  const [nodes, setNodes, onNodesChange] = useNodesState<CloudNode>(initialNodes as CloudNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DiagramEdge>(initialEdges as DiagramEdge[]);
  const [specifications, setSpecifications] = useState<NodeSpecification[]>([]);

  // History state for undo/redo
  const [history, setHistory] = useState<{
    past: DiagramState[];
    future: DiagramState[];
  }>({
    past: [],
    future: [],
  });

  // Commit current state to history (call when a discrete change completes)
  const commitToHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past, { nodes, edges, specifications }].slice(-MAX_HISTORY),
      future: [], // Clear redo stack on new change
    }));
  }, [nodes, edges, specifications]);

  // Undo - restore previous state
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      // Save current state to future before restoring
      const currentState = { nodes, edges, specifications };
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setSpecifications(previous.specifications || []);
      return {
        past: h.past.slice(0, -1),
        future: [currentState, ...h.future],
      };
    });
  }, [nodes, edges, specifications, setNodes, setEdges, setSpecifications]);

  // Redo - restore next state
  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      // Save current state to past before restoring
      const currentState = { nodes, edges, specifications };
      setNodes(next.nodes);
      setEdges(next.edges);
      setSpecifications(next.specifications || []);
      return {
        past: [...h.past, currentState],
        future: h.future.slice(1),
      };
    });
  }, [nodes, edges, specifications, setNodes, setEdges, setSpecifications]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Cmd+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Ctrl+A or Cmd+A for select all nodes
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setNodes]);

  // Selection state
  const [selectedNodes, setSelectedNodes] = useState<CloudNode[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<DiagramEdge[]>([]);

  // Notes state
  const [notes, setNotes] = useState<DiagramNotes>({
    sections: DEFAULT_NOTES_SECTIONS.map(s => ({ ...s })),
  });

  // Left panel state
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('components');

  // Section refs for keyboard shortcut focus
  const sectionRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(
    new Map(DEFAULT_NOTES_SECTIONS.map(s => [s.id, createRef<HTMLDivElement>()]))
  );

  // Handler for updating section content
  const handleUpdateNoteSection = useCallback((sectionId: string, content: string) => {
    setNotes(prev => ({
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      ),
    }));
  }, []);

  // Handler for toggling section collapse
  const handleToggleNoteSection = useCallback((sectionId: string) => {
    setNotes(prev => ({
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
      ),
    }));
  }, []);

  // Handler for expanding a section
  const handleExpandNoteSection = useCallback((sectionId: string) => {
    setNotes(prev => ({
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, collapsed: false } : s
      ),
    }));
  }, []);

  // Handler for collapsing a section
  const handleCollapseNoteSection = useCallback((sectionId: string) => {
    setNotes(prev => ({
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, collapsed: true } : s
      ),
    }));
  }, []);

  // Handler for selecting a problem template
  const handleSelectTemplate = useCallback((template: ProblemTemplate) => {
    // Update the problem section with the template's problem statement
    setNotes(prev => ({
      sections: prev.sections.map(s =>
        s.id === 'problem' ? { ...s, content: template.problemStatement, collapsed: false } : s
      ),
    }));
  }, []);

  // Specification handlers
  const handleAddSpecification = useCallback((nodeId: string) => {
    // Check if spec already exists for this node
    if (specifications.some(s => s.nodeId === nodeId)) return;

    commitToHistory();
    setSpecifications(prev => [...prev, createEmptySpecification(nodeId)]);
  }, [specifications, commitToHistory]);

  const handleUpdateSpecification = useCallback((spec: NodeSpecification) => {
    setSpecifications(prev =>
      prev.map(s => s.nodeId === spec.nodeId ? spec : s)
    );
  }, []);

  const handleDeleteSpecification = useCallback((nodeId: string) => {
    commitToHistory();
    setSpecifications(prev => prev.filter(s => s.nodeId !== nodeId));
  }, [commitToHistory]);

  // Clean up specifications when nodes are deleted
  useEffect(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    setSpecifications(prev => {
      const filtered = prev.filter(s => nodeIds.has(s.nodeId));
      // Only update if something was removed
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, [nodes]);

  // Panel state
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('none');
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // AI Assistant mode state
  const [aiChatMode, setAiChatMode] = useState<AIChatMode>('design');
  const [aiNotesContext, setAiNotesContext] = useState<NotesContext | undefined>(undefined);
  const [aiInitialMessage, setAiInitialMessage] = useState<InitialMessage | undefined>(undefined);
  const [aiExchanges, setAiExchanges] = useState<ChatExchange[]>([]);

  // Keyboard shortcuts for notes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` to toggle panel view
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setLeftPanelTab(prev => prev === 'components' ? 'notes' : 'components');
        if (leftPanelCollapsed) {
          setLeftPanelCollapsed(false);
        }
        return;
      }

      // Only handle Ctrl+1-7 if not in an input
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
        if (e.target instanceof HTMLInputElement) {
          return;
        }

        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const sectionId = DEFAULT_NOTES_SECTIONS[sectionIndex]?.id;

        if (sectionId) {
          // Switch to notes tab and expand panel if collapsed
          setLeftPanelTab('notes');
          if (leftPanelCollapsed) {
            setLeftPanelCollapsed(false);
          }

          // Expand the section if collapsed
          setNotes(prev => ({
            sections: prev.sections.map(s =>
              s.id === sectionId ? { ...s, collapsed: false } : s
            ),
          }));

          // Focus on the section after a short delay for DOM update
          setTimeout(() => {
            const ref = sectionRefs.current.get(sectionId);
            if (ref?.current) {
              ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              // Find and focus the textarea within the section
              const textarea = ref.current.querySelector('textarea');
              textarea?.focus();
            }
          }, 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [leftPanelCollapsed]);

  // Flow simulation active states
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

  // Canvas ref for imperative methods
  const canvasRef = useRef<DiagramCanvasHandle>(null);

  // Persistence
  const persistence = useDiagramPersistence({
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodeIdReset: handleNodeIdReset,
    notes,
    setNotes,
    specifications,
    setSpecifications,
    onLoad: () => {
      // Center view on loaded content after a brief delay for rendering
      setTimeout(() => canvasRef.current?.centerView(), 50);
    },
  });

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes as CloudNode[]);
    setSelectedEdges(params.edges as DiagramEdge[]);
    // Don't auto-show properties panel - require explicit edit action
  }, []);

  // Track if we need to commit after property panel closes
  const pendingPropertyCommit = useRef(false);

  // Handle node property updates
  const handleUpdateNode = useCallback(
    (nodeId: string, data: Partial<CloudNodeData>) => {
      // Commit before making changes (to save the "before" state)
      if (!pendingPropertyCommit.current) {
        commitToHistory();
        pendingPropertyCommit.current = true;
      }
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
    },
    [setNodes, commitToHistory]
  );

  // Reset pending commit when properties panel closes
  useEffect(() => {
    if (rightPanel !== 'properties') {
      pendingPropertyCommit.current = false;
    }
  }, [rightPanel]);

  // Handle double-click to open properties
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      // Deselect all nodes and select only the double-clicked one
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
      setSelectedNodes([node]);
      setRightPanel('properties');
    }
  }, [nodes, setNodes]);

  // Handle Ask AI from context menu
  const handleAskAI = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      // If the node is already part of a multi-selection, keep the selection
      // Otherwise, select just this node
      const isPartOfSelection = selectedNodes.some((n) => n.id === nodeId);
      if (!isPartOfSelection) {
        setSelectedNodes([node]);
      }
      // Switch to design mode when asking about diagram components
      setAiChatMode('design');
      setAiNotesContext(undefined);
      setAiInitialMessage(undefined);
      setRightPanel('ai');
    }
  }, [nodes, selectedNodes]);

  // Focus node ID state - when set, DiagramCanvas will center on this node
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Handle focusing a node from AI panel
  const handleFocusNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNodes([node]);
      setFocusNodeId(nodeId);
      // Clear after a short delay so it can be triggered again
      setTimeout(() => setFocusNodeId(null), 100);
    }
  }, [nodes]);

  // Apply active states for flow simulation to nodes
  const nodesWithActiveState = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isActive: node.id === activeNodeId,
    },
  }));

  // Apply active states for flow simulation and selection styling to edges
  const edgesWithActiveState = edges.map((edge) => {
    const isActive = edge.id === activeEdgeId;
    const isSelected = selectedEdges.some((e) => e.id === edge.id);
    return {
      ...edge,
      animated: isActive || edge.animated,
      style: isActive
        ? { ...edge.style, stroke: '#22c55e', strokeWidth: 3 }
        : isSelected
        ? { ...edge.style, stroke: '#3b82f6', strokeWidth: 3 }
        : edge.style,
    };
  });

  // Get the currently selected node (single selection only for properties)
  // Derive selectedNode from current nodes state to get fresh data after updates
  const selectedNode = selectedNodes.length === 1
    ? nodes.find((n) => n.id === selectedNodes[0].id) ?? null
    : null;

  const closeRightPanel = useCallback(() => {
    setRightPanel('none');
    // Clear flow simulation states when closing
    setActiveNodeId(null);
    setActiveEdgeId(null);
  }, []);

  // Get problem statement helper
  const getProblemStatement = useCallback(() => {
    return notes.sections.find(s => s.id === 'problem')?.content?.trim() || '';
  }, [notes.sections]);

  // Handler for opening AI panel in notes mode with a hint request
  const handleOpenAIForHint = useCallback((sectionId: string, sectionTitle: string) => {
    const problemStatement = getProblemStatement();
    const section = notes.sections.find(s => s.id === sectionId);
    const sectionContent = section?.content?.trim() || '';

    setAiChatMode('notes');
    setAiNotesContext({
      sectionId,
      sectionTitle,
      sectionContent,
      problemStatement,
    });
    setAiInitialMessage({
      id: `hint-${sectionId}-${Date.now()}`,
      text: `Give me a hint for the "${sectionTitle}" section. Start with general guidance, and I'll ask for more specific help if needed.`,
    });
    setRightPanel('ai');
  }, [notes.sections, getProblemStatement]);

  // Handler for opening AI panel in notes mode with a validation request
  const handleOpenAIForValidation = useCallback((sectionId: string, sectionTitle: string) => {
    const problemStatement = getProblemStatement();
    const section = notes.sections.find(s => s.id === sectionId);
    const sectionContent = section?.content?.trim() || '';

    setAiChatMode('notes');
    setAiNotesContext({
      sectionId,
      sectionTitle,
      sectionContent,
      problemStatement,
    });
    setAiInitialMessage({
      id: `check-${sectionId}-${Date.now()}`,
      text: `Please review my "${sectionTitle}" notes and give me feedback. What have I covered well? What am I missing? Any suggestions for improvement?`,
    });
    setRightPanel('ai');
  }, [notes.sections, getProblemStatement]);

  // Clear initial message after it's been sent
  const handleInitialMessageSent = useCallback(() => {
    setAiInitialMessage(undefined);
  }, []);

  // Switch to design mode when canvas is interacted with
  const handleCanvasInteraction = useCallback(() => {
    if (aiChatMode === 'notes') {
      setAiChatMode('design');
      setAiNotesContext(undefined);
    }
  }, [aiChatMode]);

  // Handle manual mode change from AI panel
  const handleAIModeChange = useCallback((newMode: AIChatMode) => {
    setAiChatMode(newMode);
    setAiInitialMessage(undefined);
    if (newMode === 'design') {
      setAiNotesContext(undefined);
    } else if (newMode === 'notes') {
      // When switching to notes mode manually, just provide problem statement for general questions
      const problemStatement = getProblemStatement();
      setAiNotesContext({
        sectionId: 'general',
        sectionTitle: 'General',
        sectionContent: '',
        problemStatement,
      });
    }
  }, [getProblemStatement]);

  // Close right panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && rightPanel !== 'none') {
        // Don't close if user is typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        closeRightPanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rightPanel, closeRightPanel]);

  // Handle right panel resize
  const handleResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setRightPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle left panel resize
  const handleLeftResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsLeftResizing(true);
  }, []);

  useEffect(() => {
    if (!isLeftResizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newWidth = e.clientX;
      setLeftPanelWidth(Math.min(MAX_LEFT_PANEL_WIDTH, Math.max(MIN_LEFT_PANEL_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsLeftResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLeftResizing]);

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${isResizing || isLeftResizing ? 'select-none' : ''}`}>
      {/* Header - full width at top */}
      <header className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={persistence.diagramName}
              onChange={(e) => persistence.setDiagramName(e.target.value)}
              className="text-lg font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 -ml-1"
            />
            <div className="w-px h-6 bg-gray-200" />
            <ModelSelector />
          </div>
          <div className="flex items-center gap-2">
            {/* File actions */}
            <button
              onClick={persistence.newDiagram}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="New Diagram"
            >
              New
            </button>
            <button
              onClick={persistence.load}
              disabled={persistence.isLoading}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Open Diagram"
            >
              Open
            </button>
            <button
              onClick={persistence.quickSave}
              disabled={persistence.isLoading}
              className="px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
              title="Save Diagram"
            >
              Save
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 0 1 5 5v2M3 10l4-4M3 10l4 4" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 0 0-5 5v2M21 10l-4-4M21 10l-4 4" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* AI and Flow actions */}
            <button
              onClick={() => setRightPanel(rightPanel === 'ai' ? 'none' : 'ai')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                rightPanel === 'ai'
                  ? 'bg-purple-500 text-white'
                  : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
              }`}
              title="AI Assistant"
            >
              AI Assistant
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === 'flow' ? 'none' : 'flow')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                rightPanel === 'flow'
                  ? 'bg-green-500 text-white'
                  : 'text-green-600 bg-green-50 hover:bg-green-100'
              }`}
              title="Flow Simulator"
            >
              Simulate Flow
            </button>
          </div>
        </header>

      {/* Main content area - below header */}
      <div className="flex-1 flex relative min-h-0">
        {/* Left sidebar - Component palette / Notes (absolute positioned to overlay canvas only) */}
        <div
          className={`absolute top-0 bottom-0 left-0 z-20 transition-transform duration-200 ${leftPanelCollapsed ? '-translate-x-full' : ''}`}
          style={{ width: leftPanelWidth }}
        >
          <div className="h-full">
            <LeftPanel
              activeTab={leftPanelTab}
              onTabChange={setLeftPanelTab}
              notes={notes}
              onUpdateNoteSection={handleUpdateNoteSection}
              onToggleNoteSection={handleToggleNoteSection}
              onExpandNoteSection={handleExpandNoteSection}
              onCollapseNoteSection={handleCollapseNoteSection}
              sectionRefs={sectionRefs.current}
              // AI Assist props
              canUseAssist={!!getProblemStatement()}
              onOpenAIForHint={handleOpenAIForHint}
              onOpenAIForValidation={handleOpenAIForValidation}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>
          {/* Resize handle - positioned on right edge, with gap for collapse button */}
          <div
            className={`absolute top-0 -right-1 w-2 cursor-ew-resize hover:bg-blue-400 transition-colors z-30 ${
              isLeftResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            style={{ bottom: 'calc(50% + 20px)' }}
            onMouseDown={handleLeftResizeStart}
          />
          <div
            className={`absolute bottom-0 -right-1 w-2 cursor-ew-resize hover:bg-blue-400 transition-colors z-30 ${
              isLeftResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            style={{ top: 'calc(50% + 20px)' }}
            onMouseDown={handleLeftResizeStart}
          />
          {/* Collapse/expand toggle */}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 rounded-r-md shadow-sm p-1 hover:bg-gray-50 transition-colors ${
              leftPanelCollapsed ? 'left-full' : '-right-3'
            }`}
            title={leftPanelCollapsed ? 'Show panel' : 'Hide panel'}
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${leftPanelCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Error toast */}
        {persistence.error && (
          <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm">{persistence.error}</span>
            <button
              onClick={persistence.clearError}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 min-w-0">
          <DiagramCanvas
            ref={canvasRef}
            nodes={nodesWithActiveState as CloudNode[]}
            edges={edgesWithActiveState as DiagramEdge[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChange={onSelectionChange}
            onNodeDoubleClick={handleNodeDoubleClick}
            onAskAI={handleAskAI}
            getNextNodeId={getNextNodeId}
            focusNodeId={focusNodeId}
            onHistoryCommit={commitToHistory}
            specifications={specifications}
            onAddSpecification={handleAddSpecification}
            onUpdateSpecification={handleUpdateSpecification}
            onDeleteSpecification={handleDeleteSpecification}
          />
        </div>

        {/* Right sidebar - Context-dependent with resize handle */}
        {rightPanel !== 'none' && (
          <div
            className="relative flex bg-white border-l border-gray-200 z-20"
            style={{ width: rightPanelWidth }}
          >
          {/* Resize handle */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 transition-colors z-10 ${
              isResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            onMouseDown={handleResizeStart}
          />

          {/* Panel content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {rightPanel === 'properties' && (
              <NodePropertiesPanel
                node={selectedNode}
                onUpdateNode={handleUpdateNode}
                onClose={closeRightPanel}
              />
            )}

            {rightPanel === 'ai' && (
              <AIChatPanel
                nodes={nodes}
                edges={edges}
                selectedNodes={selectedNodes}
                notes={notes}
                onClose={closeRightPanel}
                onFocusNode={handleFocusNode}
                mode={aiChatMode}
                onModeChange={handleAIModeChange}
                notesContext={aiNotesContext}
                initialMessage={aiInitialMessage}
                onInitialMessageSent={handleInitialMessageSent}
                exchanges={aiExchanges}
                onExchangesChange={setAiExchanges}
              />
            )}

            {rightPanel === 'flow' && (
              <FlowSimulator
                nodes={nodes}
                edges={edges}
                notes={notes}
                onActiveNodeChange={setActiveNodeId}
                onActiveEdgeChange={setActiveEdgeId}
                onClose={closeRightPanel}
              />
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SettingsProvider>
      <HomeContent />
    </SettingsProvider>
  );
}
