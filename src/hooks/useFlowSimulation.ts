'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FlowStep, CloudNode, DiagramEdge, DiagramNotes } from '@/types/diagram';
import { generateFlowSteps, continueFlowGeneration } from '@/lib/ai/flowGeneration';

export type SimulationStatus = 'idle' | 'generating' | 'ready' | 'playing' | 'paused' | 'clarifying';

interface UseFlowSimulationOptions {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  notes: DiagramNotes;
  onActiveNodeChange?: (nodeId: string | null) => void;
  onActiveEdgeChange?: (edgeId: string | null) => void;
  baseDelay?: number; // Base delay between steps in ms (default: 2000)
  model?: string;
}

interface UseFlowSimulationReturn {
  // State
  status: SimulationStatus;
  steps: FlowStep[];
  currentStepIndex: number;
  currentStep: FlowStep | null;
  error: string | null;
  clarificationQuestion: string | null;
  scenario: string;

  // Controls
  generateFlow: (scenario: string) => Promise<void>;
  answerClarification: (answer: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToStep: (index: number) => void;
  setSpeed: (multiplier: number) => void;

  // Derived state
  isPlaying: boolean;
  canStepForward: boolean;
  canStepBackward: boolean;
  progress: number;
}

export function useFlowSimulation({
  nodes,
  edges,
  notes,
  onActiveNodeChange,
  onActiveEdgeChange,
  baseDelay = 2000,
  model,
}: UseFlowSimulationOptions): UseFlowSimulationReturn {
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [scenario, setScenario] = useState('');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Current step derived state
  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length
    ? steps[currentStepIndex]
    : null;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Notify about active node/edge changes
  useEffect(() => {
    if (currentStep) {
      onActiveNodeChange?.(currentStep.nodeId);
      onActiveEdgeChange?.(currentStep.edgeId || null);
    } else {
      onActiveNodeChange?.(null);
      onActiveEdgeChange?.(null);
    }
  }, [currentStep, onActiveNodeChange, onActiveEdgeChange]);

  // Auto-advance when playing
  useEffect(() => {
    if (status === 'playing' && currentStep) {
      // Use base delay + step's own duration, adjusted by speed multiplier
      const totalDelay = (baseDelay + currentStep.duration) / speedMultiplier;

      timerRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((i) => i + 1);
        } else {
          // Finished
          setStatus('paused');
        }
      }, totalDelay);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [status, currentStep, currentStepIndex, steps.length, speedMultiplier, baseDelay]);

  // Generate flow from scenario
  const generateFlow = useCallback(async (newScenario: string) => {
    if (!newScenario.trim()) return;

    setStatus('generating');
    setError(null);
    setClarificationQuestion(null);
    setScenario(newScenario);
    setSteps([]);
    setCurrentStepIndex(-1);

    const result = await generateFlowSteps(nodes, edges, newScenario, notes, model);

    if (!result.success) {
      setError(result.error || 'Failed to generate flow');
      setStatus('idle');
      return;
    }

    if (result.ambiguous && result.question) {
      setClarificationQuestion(result.question);
      setStatus('clarifying');
      return;
    }

    if (result.steps && result.steps.length > 0) {
      setSteps(result.steps);
      setCurrentStepIndex(0);
      setStatus('ready');
    } else {
      setError('No steps generated');
      setStatus('idle');
    }
  }, [nodes, edges, notes, model]);

  // Answer clarification question
  const answerClarification = useCallback(async (answer: string) => {
    if (!clarificationQuestion) return;

    setStatus('generating');
    setClarificationQuestion(null);

    const result = await continueFlowGeneration(nodes, edges, scenario, answer, notes, model);

    if (!result.success) {
      setError(result.error || 'Failed to generate flow');
      setStatus('idle');
      return;
    }

    if (result.ambiguous && result.question) {
      setClarificationQuestion(result.question);
      setStatus('clarifying');
      return;
    }

    if (result.steps && result.steps.length > 0) {
      setSteps(result.steps);
      setCurrentStepIndex(0);
      setStatus('ready');
    } else {
      setError('No steps generated');
      setStatus('idle');
    }
  }, [nodes, edges, scenario, clarificationQuestion, notes, model]);

  // Playback controls
  const play = useCallback(() => {
    if (steps.length === 0) return;

    if (currentStepIndex === -1 || currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }

    setStatus('playing');
  }, [steps.length, currentStepIndex]);

  const pause = useCallback(() => {
    setStatus('paused');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    setStatus('ready');
    setCurrentStepIndex(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
      if (status === 'playing') {
        setStatus('paused');
      }
    }
  }, [currentStepIndex, steps.length, status]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
      if (status === 'playing') {
        setStatus('paused');
      }
    }
  }, [currentStepIndex, status]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      if (status === 'playing') {
        setStatus('paused');
      }
    }
  }, [steps.length, status]);

  const setSpeed = useCallback((multiplier: number) => {
    setSpeedMultiplier(Math.max(0.25, Math.min(4, multiplier)));
  }, []);

  return {
    // State
    status,
    steps,
    currentStepIndex,
    currentStep,
    error,
    clarificationQuestion,
    scenario,

    // Controls
    generateFlow,
    answerClarification,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    goToStep,
    setSpeed,

    // Derived state
    isPlaying: status === 'playing',
    canStepForward: currentStepIndex < steps.length - 1,
    canStepBackward: currentStepIndex > 0,
    progress: steps.length > 0 ? (currentStepIndex + 1) / steps.length : 0,
  };
}
