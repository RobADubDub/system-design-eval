import { SavedDiagram, DiagramState, DiagramNotes, SpecItem, NodeSpecification, DEFAULT_NOTES_SECTIONS, generateSpecItemId } from '@/types/diagram';
import { NotesAssistState, SectionAssistState, createDefaultSectionAssistState } from '@/types/notesAssist';

const CURRENT_VERSION = '2.1';

// ============================================
// Serialization: Strip default/empty values
// ============================================

// Serialized spec item (no runtime ID)
interface SerializedSpecItem {
  text: string;
  children?: SerializedSpecItem[];
}

/**
 * Check if section assist state is default (no hints, no validation)
 */
function isDefaultSectionAssistState(state: SectionAssistState): boolean {
  return (
    state.currentHintLevel === null &&
    state.hints.length === 0 &&
    state.validationResult === null &&
    state.isLoading === false
  );
}

/**
 * Clean spec items: strip runtime IDs, remove empty children arrays
 */
function cleanSpecItems(items: SpecItem[]): SerializedSpecItem[] {
  return items.map(item => {
    const cleaned: SerializedSpecItem = { text: item.text };
    if (item.children.length > 0) {
      cleaned.children = cleanSpecItems(item.children);
    }
    return cleaned;
  });
}

/**
 * Check if a specification has meaningful content
 */
function hasSpecContent(spec: NodeSpecification): boolean {
  const hasText = spec.items.some(item =>
    item.text.trim() !== '' ||
    (item.children && item.children.some(c => c.text.trim() !== ''))
  );
  return hasText;
}

/**
 * Clean specifications: only keep those with content, strip runtime IDs
 */
function cleanSpecifications(specs: NodeSpecification[] | undefined): SerializedNodeSpecification[] | undefined {
  if (!specs || specs.length === 0) return undefined;

  const cleaned = specs
    .filter(hasSpecContent)
    .map(spec => ({
      nodeId: spec.nodeId,
      items: cleanSpecItems(spec.items),
      offsetX: spec.offsetX,
      offsetY: spec.offsetY,
      collapsed: spec.collapsed,
    }));

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Clean notes assist state: only keep sections with non-default state
 */
function cleanNotesAssistState(state: NotesAssistState | undefined): NotesAssistState | undefined {
  if (!state) return undefined;

  const nonDefaultSections = state.sections.filter(s => !isDefaultSectionAssistState(s));

  if (nonDefaultSections.length === 0) return undefined;

  return { sections: nonDefaultSections };
}

/**
 * Clean notes sections: only keep sections with content different from default
 */
function cleanNotesSections(notes: DiagramNotes | undefined): DiagramNotes | undefined {
  if (!notes) return undefined;

  const sectionsWithContent = notes.sections.filter(section => {
    const defaultSection = DEFAULT_NOTES_SECTIONS.find(d => d.id === section.id);
    // Keep if content differs from default (or no default exists)
    return section.content.trim() !== '' &&
           (!defaultSection || section.content !== defaultSection.content);
  });

  if (sectionsWithContent.length === 0) return undefined;

  return { sections: sectionsWithContent };
}

/**
 * Clean diagram state for serialization
 */
function cleanDiagramState(state: DiagramState): SerializedDiagramState {
  return {
    nodes: state.nodes,
    edges: state.edges,
    specifications: cleanSpecifications(state.specifications),
  };
}

/**
 * Prepare diagram for serialization (strip defaults and runtime IDs)
 */
function cleanDiagramForSave(diagram: SavedDiagram): SerializedSavedDiagram {
  const cleaned: SerializedSavedDiagram = {
    version: diagram.version,
    name: diagram.name,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
    state: cleanDiagramState(diagram.state),
  };

  const cleanedNotes = cleanNotesSections(diagram.notes);
  if (cleanedNotes) {
    cleaned.notes = cleanedNotes;
  }

  const cleanedNotesAssist = cleanNotesAssistState(diagram.notesAssist);
  if (cleanedNotesAssist) {
    cleaned.notesAssist = cleanedNotesAssist;
  }

  return cleaned;
}

// ============================================
// Deserialization: Restore defaults
// ============================================

/**
 * Restore spec items: regenerate runtime IDs, ensure children arrays exist
 */
function restoreSpecItems(items: SerializedSpecItem[]): SpecItem[] {
  return items.map(item => ({
    id: generateSpecItemId(),
    text: item.text,
    children: item.children ? restoreSpecItems(item.children) : [],
  }));
}

// Serialized specification (with SerializedSpecItem, no runtime IDs)
interface SerializedNodeSpecification {
  nodeId: string;
  items: SerializedSpecItem[];
  offsetX: number;
  offsetY: number;
  collapsed: boolean;
}

// Serialized diagram state (for persistence)
interface SerializedDiagramState {
  nodes: DiagramState['nodes'];
  edges: DiagramState['edges'];
  specifications?: SerializedNodeSpecification[];
}

// Serialized saved diagram (the actual file format)
interface SerializedSavedDiagram {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: SerializedDiagramState;
  notes?: DiagramNotes;
  notesAssist?: NotesAssistState;
}

/**
 * Restore specifications: regenerate IDs, ensure children arrays
 */
function restoreSpecifications(specs: SerializedNodeSpecification[] | undefined): NodeSpecification[] | undefined {
  if (!specs) return undefined;
  return specs.map(spec => ({
    ...spec,
    items: restoreSpecItems(spec.items),
  }));
}

/**
 * Restore notes assist state with defaults for missing sections
 */
function restoreNotesAssistState(
  state: NotesAssistState | undefined,
  sectionIds: string[]
): NotesAssistState {
  const existingSections = state?.sections ?? [];

  return {
    sections: sectionIds.map(id => {
      const existing = existingSections.find(s => s.sectionId === id);
      return existing ?? createDefaultSectionAssistState(id);
    }),
  };
}

/**
 * Restore diagram state: regenerate runtime IDs, restore defaults
 */
function restoreDiagramState(state: SerializedDiagramState): DiagramState {
  return {
    nodes: state.nodes,
    edges: state.edges,
    specifications: restoreSpecifications(state.specifications),
  };
}

/**
 * Create a new saved diagram object
 */
export function createSavedDiagram(
  name: string,
  state: DiagramState,
  notes?: DiagramNotes,
  notesAssist?: NotesAssistState
): SavedDiagram {
  const now = new Date().toISOString();
  return {
    version: CURRENT_VERSION,
    name,
    createdAt: now,
    updatedAt: now,
    state,
    notes,
    notesAssist,
  };
}

/**
 * Update an existing saved diagram
 */
export function updateSavedDiagram(
  diagram: SavedDiagram,
  state: DiagramState,
  name?: string,
  notes?: DiagramNotes,
  notesAssist?: NotesAssistState
): SavedDiagram {
  return {
    ...diagram,
    name: name ?? diagram.name,
    updatedAt: new Date().toISOString(),
    state,
    notes: notes ?? diagram.notes,
    notesAssist: notesAssist ?? diagram.notesAssist,
  };
}

/**
 * Serialize diagram to JSON string (strips default values)
 */
export function serializeDiagram(diagram: SavedDiagram): string {
  const cleaned = cleanDiagramForSave(diagram);
  return JSON.stringify(cleaned, null, 2);
}

/**
 * Parse JSON string to diagram (restores default values)
 */
export function parseDiagram(json: string): SavedDiagram {
  const parsed = JSON.parse(json);

  // Validate required fields
  if (!parsed.version || !parsed.name || !parsed.state) {
    throw new Error('Invalid diagram file: missing required fields');
  }

  if (!parsed.state.nodes || !parsed.state.edges) {
    throw new Error('Invalid diagram file: missing nodes or edges');
  }

  // Restore defaults for optional/nested fields
  const sectionIds = DEFAULT_NOTES_SECTIONS.map(s => s.id);

  const restored: SavedDiagram = {
    ...parsed,
    state: restoreDiagramState(parsed.state),
    notesAssist: restoreNotesAssistState(parsed.notesAssist, sectionIds),
  };

  return restored;
}

/**
 * Download diagram as JSON file (works in all browsers)
 */
export function downloadDiagram(diagram: SavedDiagram): void {
  const json = serializeDiagram(diagram);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(diagram.name)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Save diagram using File System Access API (Chrome/Edge)
 * Falls back to download if not supported
 */
export async function saveDiagramWithPicker(
  diagram: SavedDiagram
): Promise<boolean> {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: (options: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: `${sanitizeFilename(diagram.name)}.json`,
        types: [
          {
            description: 'System Design Diagram',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(serializeDiagram(diagram));
      await writable.close();
      return true;
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name === 'AbortError') {
        return false;
      }
      // Fall back to download
      downloadDiagram(diagram);
      return true;
    }
  }

  // Fall back to download
  downloadDiagram(diagram);
  return true;
}

/**
 * Load diagram from file using File System Access API
 */
export async function loadDiagramWithPicker(): Promise<SavedDiagram | null> {
  // Check if File System Access API is supported
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as Window & { showOpenFilePicker: (options: object) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
        types: [
          {
            description: 'System Design Diagram',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const text = await file.text();
      return parseDiagram(text);
    } catch (err) {
      // User cancelled
      if ((err as Error).name === 'AbortError') {
        return null;
      }
      throw err;
    }
  }

  // Fall back to input element
  return loadDiagramWithInput();
}

/**
 * Load diagram using traditional file input (works in all browsers)
 */
export function loadDiagramWithInput(): Promise<SavedDiagram | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const diagram = parseDiagram(text);
        resolve(diagram);
      } catch (err) {
        reject(err);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Load diagram from a dropped file
 */
export async function loadDiagramFromFile(file: File): Promise<SavedDiagram> {
  const text = await file.text();
  return parseDiagram(text);
}

/**
 * Calculate the next node ID based on existing nodes
 */
export function getMaxNodeId(state: DiagramState): number {
  if (state.nodes.length === 0) return 0;
  return Math.max(...state.nodes.map((n) => parseInt(n.id, 10) || 0));
}

/**
 * Sanitize filename for saving
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100) || 'diagram';
}
