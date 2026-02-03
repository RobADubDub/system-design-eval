import { CloudNode, DiagramEdge, FlowStep, DiagramNotes } from '@/types/diagram';
import { serializeDiagramForFlow, serializeNotesForAI } from './diagramSerializer';

export interface FlowGenerationResult {
  success: boolean;
  steps?: FlowStep[];
  ambiguous?: boolean;
  question?: string;
  error?: string;
}

/**
 * Try to resolve a node reference to an actual node ID
 * First tries exact ID match, then falls back to label matching
 */
function resolveNodeId(
  reference: string,
  nodes: CloudNode[]
): string | null {
  // Try exact ID match first
  const exactMatch = nodes.find((n) => n.id === reference);
  if (exactMatch) return exactMatch.id;

  // Try case-insensitive label match
  const labelMatch = nodes.find(
    (n) => n.data.label.toLowerCase() === reference.toLowerCase()
  );
  if (labelMatch) return labelMatch.id;

  // Try partial label match (contains)
  const partialMatch = nodes.find(
    (n) =>
      n.data.label.toLowerCase().includes(reference.toLowerCase()) ||
      reference.toLowerCase().includes(n.data.label.toLowerCase())
  );
  if (partialMatch) return partialMatch.id;

  return null;
}

/**
 * Generate flow steps using the AI
 */
export async function generateFlowSteps(
  nodes: CloudNode[],
  edges: DiagramEdge[],
  scenario: string,
  notes?: DiagramNotes,
  model?: string
): Promise<FlowGenerationResult> {
  try {
    const flowDiagramContext = serializeDiagramForFlow(nodes, edges);
    const notesContext = notes ? serializeNotesForAI(notes) : undefined;

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'flow',
        flowDiagramContext,
        scenario,
        notesContext,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate flow');
    }

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error };
    }

    if (data.ambiguous) {
      return {
        success: true,
        ambiguous: true,
        question: data.question,
      };
    }

    if (!data.steps || !Array.isArray(data.steps)) {
      return {
        success: false,
        error: 'AI did not return valid flow steps. Please try rephrasing the scenario.',
      };
    }

    // Map and validate steps, trying to resolve node references
    const mappedSteps: FlowStep[] = [];
    const unmappedSteps: string[] = [];

    for (const step of data.steps) {
      const nodeRef = step.nodeId || step.node || step.component || '';
      const resolvedId = resolveNodeId(nodeRef, nodes);

      if (resolvedId) {
        mappedSteps.push({
          nodeId: resolvedId,
          edgeId: step.edgeId,
          description: step.description || '',
          duration: step.duration || 100,
        });
      } else {
        unmappedSteps.push(nodeRef || '(empty)');
      }
    }

    if (mappedSteps.length === 0) {
      const availableNodes = nodes.map((n) => `"${n.data.label}" (id: ${n.id})`).join(', ');
      const attemptedRefs = unmappedSteps.join(', ');

      return {
        success: false,
        error: `Could not map any flow steps to your diagram.\n\nAI referenced: ${attemptedRefs}\n\nAvailable components: ${availableNodes}\n\nTry using component names that match your diagram, or add components the flow might need.`,
      };
    }

    // Warn if some steps couldn't be mapped but we have partial results
    if (unmappedSteps.length > 0) {
      console.warn(
        `Some flow steps could not be mapped: ${unmappedSteps.join(', ')}`
      );
    }

    return {
      success: true,
      steps: mappedSteps,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Continue flow generation after clarification
 */
export async function continueFlowGeneration(
  nodes: CloudNode[],
  edges: DiagramEdge[],
  originalScenario: string,
  clarification: string,
  notes?: DiagramNotes,
  model?: string
): Promise<FlowGenerationResult> {
  // Combine original scenario with clarification
  const enhancedScenario = `${originalScenario}. Additional context: ${clarification}`;
  return generateFlowSteps(nodes, edges, enhancedScenario, notes, model);
}
