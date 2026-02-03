import { SavedDiagram, DiagramState, DiagramNotes } from '@/types/diagram';
import { NotesAssistState } from '@/types/notesAssist';

const CURRENT_VERSION = '2.0';

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
 * Serialize diagram to JSON string
 */
export function serializeDiagram(diagram: SavedDiagram): string {
  return JSON.stringify(diagram, null, 2);
}

/**
 * Parse JSON string to diagram
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

  return parsed as SavedDiagram;
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
