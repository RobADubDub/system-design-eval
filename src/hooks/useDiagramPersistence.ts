'use client';

import { useState, useCallback, DragEvent } from 'react';
import {
  SavedDiagram,
  DiagramState,
  CloudNode,
  DiagramEdge,
  DiagramNotes,
  NodeSpecification,
  DEFAULT_NOTES_SECTIONS,
} from '@/types/diagram';
import { NotesAssistState, createDefaultNotesAssistState } from '@/types/notesAssist';
import {
  createSavedDiagram,
  updateSavedDiagram,
  saveDiagramWithPicker,
  loadDiagramWithPicker,
  loadDiagramFromFile,
  getMaxNodeId,
  downloadDiagram,
} from '@/lib/persistence';

interface UseDiagramPersistenceOptions {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  setNodes: React.Dispatch<React.SetStateAction<CloudNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<DiagramEdge[]>>;
  onNodeIdReset: (maxId: number) => void;
  notes: DiagramNotes;
  setNotes: React.Dispatch<React.SetStateAction<DiagramNotes>>;
  setNotesAssist?: React.Dispatch<React.SetStateAction<NotesAssistState>>;
  specifications: NodeSpecification[];
  setSpecifications: React.Dispatch<React.SetStateAction<NodeSpecification[]>>;
}

interface UseDiagramPersistenceReturn {
  currentDiagram: SavedDiagram | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  diagramName: string;
  setDiagramName: (name: string) => void;
  save: () => Promise<boolean>;
  saveAs: () => Promise<boolean>;
  quickSave: () => void;
  load: () => Promise<boolean>;
  loadFromDrop: (file: File) => Promise<boolean>;
  newDiagram: () => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => Promise<void>;
  clearError: () => void;
}

export function useDiagramPersistence({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodeIdReset,
  notes,
  setNotes,
  setNotesAssist,
  specifications,
  setSpecifications,
}: UseDiagramPersistenceOptions): UseDiagramPersistenceReturn {
  const [currentDiagram, setCurrentDiagram] = useState<SavedDiagram | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagramName, setDiagramNameState] = useState('Untitled Diagram');

  const setDiagramName = useCallback((name: string) => {
    setDiagramNameState(name);
    setIsDirty(true);
  }, []);

  const getCurrentState = useCallback((): DiagramState => {
    return { nodes, edges, specifications };
  }, [nodes, edges, specifications]);

  const getCurrentNotes = useCallback((): DiagramNotes => {
    return notes;
  }, [notes]);

  // Save with file picker (Save As)
  const saveAs = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const state = getCurrentState();
      const currentNotes = getCurrentNotes();
      const diagram = currentDiagram
        ? updateSavedDiagram(currentDiagram, state, diagramName, currentNotes)
        : createSavedDiagram(diagramName, state, currentNotes);

      const success = await saveDiagramWithPicker(diagram);

      if (success) {
        setCurrentDiagram(diagram);
        setIsDirty(false);
      }

      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentDiagram, diagramName, getCurrentState, getCurrentNotes]);

  // Quick save (download without picker)
  const quickSave = useCallback(() => {
    const state = getCurrentState();
    const currentNotes = getCurrentNotes();
    const diagram = currentDiagram
      ? updateSavedDiagram(currentDiagram, state, diagramName, currentNotes)
      : createSavedDiagram(diagramName, state, currentNotes);

    downloadDiagram(diagram);
    setCurrentDiagram(diagram);
    setIsDirty(false);
  }, [currentDiagram, diagramName, getCurrentState, getCurrentNotes]);

  // Save (uses picker if supported, otherwise downloads)
  const save = useCallback(async (): Promise<boolean> => {
    return saveAs();
  }, [saveAs]);

  // Load diagram from state
  const applyDiagram = useCallback(
    (diagram: SavedDiagram) => {
      setNodes(diagram.state.nodes);
      setEdges(diagram.state.edges);
      setCurrentDiagram(diagram);
      setDiagramNameState(diagram.name);
      setIsDirty(false);

      // Load specifications, using empty array for backwards compatibility
      setSpecifications(diagram.state.specifications || []);

      // Load notes, using defaults for backwards compatibility
      if (diagram.notes) {
        setNotes(diagram.notes);
      } else {
        // Old diagram without notes - reset to defaults
        setNotes({ sections: DEFAULT_NOTES_SECTIONS.map(s => ({ ...s })) });
      }

      // Reset notes assist state (AI feedback is ephemeral, not persisted)
      if (setNotesAssist) {
        const sectionIds = diagram.notes?.sections.map(s => s.id)
          || DEFAULT_NOTES_SECTIONS.map(s => s.id);
        setNotesAssist(createDefaultNotesAssistState(sectionIds));
      }

      // Reset node ID counter
      const maxId = getMaxNodeId(diagram.state);
      onNodeIdReset(maxId);
    },
    [setNodes, setEdges, onNodeIdReset, setNotes, setNotesAssist, setSpecifications]
  );

  // Load with file picker
  const load = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const diagram = await loadDiagramWithPicker();

      if (diagram) {
        applyDiagram(diagram);
        return true;
      }

      return false;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyDiagram]);

  // Load from dropped file
  const loadFromDrop = useCallback(
    async (file: File): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const diagram = await loadDiagramFromFile(file);
        applyDiagram(diagram);
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [applyDiagram]
  );

  // Create new diagram
  const newDiagram = useCallback(() => {
    setCurrentDiagram(null);
    setDiagramNameState('Untitled Diagram');
    setIsDirty(false);
    setNodes([]);
    setEdges([]);
    setSpecifications([]);
    setNotes({ sections: DEFAULT_NOTES_SECTIONS.map(s => ({ ...s })) });
    if (setNotesAssist) {
      setNotesAssist(createDefaultNotesAssistState(DEFAULT_NOTES_SECTIONS.map(s => s.id)));
    }
    onNodeIdReset(0);
  }, [setNodes, setEdges, onNodeIdReset, setNotes, setNotesAssist, setSpecifications]);

  // Drag and drop handlers for file loading
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        await loadFromDrop(file);
      }
    },
    [loadFromDrop]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentDiagram,
    isDirty,
    isLoading,
    error,
    diagramName,
    setDiagramName,
    save,
    saveAs,
    quickSave,
    load,
    loadFromDrop,
    newDiagram,
    handleDragOver,
    handleDrop,
    clearError,
  };
}
