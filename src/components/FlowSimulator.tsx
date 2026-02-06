'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useFlowSimulation, SimulationStatus } from '@/hooks/useFlowSimulation';
import { CloudNode, DiagramEdge, DiagramNotes } from '@/types/diagram';
import { useSettings } from '@/components/settings/SettingsContext';

interface FlowSimulatorProps {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  notes: DiagramNotes;
  onActiveNodeChange: (nodeId: string | null) => void;
  onActiveEdgeChange: (edgeId: string | null) => void;
  onClose: () => void;
}

export function FlowSimulator({
  nodes,
  edges,
  notes,
  onActiveNodeChange,
  onActiveEdgeChange,
  onClose,
}: FlowSimulatorProps) {
  const { settings } = useSettings();
  const [scenarioInput, setScenarioInput] = useState('');
  const [clarificationInput, setClarificationInput] = useState('');
  const [suggestedScenarios, setSuggestedScenarios] = useState<string[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const stepListRef = useRef<HTMLDivElement>(null);

  // Get problem statement from notes
  const problemStatement = notes.sections.find(s => s.id === 'problem')?.content?.trim() || '';
  const hasProblemStatement = problemStatement.length > 0;

  const simulation = useFlowSimulation({
    nodes,
    edges,
    notes,
    onActiveNodeChange,
    onActiveEdgeChange,
    model: settings.selectedModel,
  });

  // Generate scenario suggestions from problem statement
  const generateScenarioSuggestions = async () => {
    if (!hasProblemStatement) return;

    setIsLoadingScenarios(true);
    try {
      const response = await fetch('/api/ai/notes-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scenarios',
          problemStatement,
          model: settings.selectedModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scenarios && Array.isArray(data.scenarios)) {
          setSuggestedScenarios(data.scenarios);
        }
      }
    } catch (error) {
      console.error('Failed to generate scenarios:', error);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  // Keyboard navigation for step list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have steps and not typing in an input
      if (
        simulation.steps.length === 0 ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        simulation.stepForward();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        simulation.stepBackward();
      } else if (e.key === ' ' && simulation.steps.length > 0) {
        // Space to play/pause
        e.preventDefault();
        if (simulation.isPlaying) {
          simulation.pause();
        } else {
          simulation.play();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [simulation]);

  // Auto-scroll step list to keep current step visible
  useEffect(() => {
    if (stepListRef.current && simulation.currentStepIndex >= 0) {
      const stepButtons = stepListRef.current.querySelectorAll('button');
      const currentButton = stepButtons[simulation.currentStepIndex];
      if (currentButton) {
        currentButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [simulation.currentStepIndex]);

  const handleGenerateFlow = (e: FormEvent) => {
    e.preventDefault();
    if (scenarioInput.trim()) {
      simulation.generateFlow(scenarioInput.trim());
    }
  };

  const handleClarification = (e: FormEvent) => {
    e.preventDefault();
    if (clarificationInput.trim()) {
      simulation.answerClarification(clarificationInput.trim());
      setClarificationInput('');
    }
  };

  const handleExampleClick = (scenario: string) => {
    setScenarioInput(scenario);
    simulation.generateFlow(scenario);
  };

  const getStatusLabel = (status: SimulationStatus): string => {
    switch (status) {
      case 'idle': return 'Ready';
      case 'generating': return 'Generating...';
      case 'ready': return 'Ready to play';
      case 'playing': return 'Playing';
      case 'paused': return 'Paused';
      case 'clarifying': return 'Need clarification';
      default: return status;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">Flow</span>
          <span className="font-medium text-gray-800 text-sm">Simulator</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scenario input */}
      <div className="p-3 border-b border-gray-100">
        <form onSubmit={handleGenerateFlow}>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Describe a scenario
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={scenarioInput}
              onChange={(e) => setScenarioInput(e.target.value)}
              placeholder="e.g., User login flow"
              disabled={simulation.status === 'generating'}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={simulation.status === 'generating' || !scenarioInput.trim()}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Go
            </button>
          </div>
        </form>

        {/* Scenario suggestions */}
        <div className="mt-2">
          {suggestedScenarios.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {suggestedScenarios.map((scenario) => (
                <button
                  key={scenario}
                  onClick={() => handleExampleClick(scenario)}
                  disabled={simulation.status === 'generating'}
                  className="px-2 py-0.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                >
                  {scenario}
                </button>
              ))}
            </div>
          ) : hasProblemStatement ? (
            <button
              onClick={generateScenarioSuggestions}
              disabled={isLoadingScenarios}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {isLoadingScenarios ? 'Generating suggestions...' : 'Suggest scenarios for this system'}
            </button>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Add a problem statement in Notes to get scenario suggestions
            </p>
          )}
        </div>
      </div>

      {/* Error display */}
      {simulation.error && (
        <div className="p-3 bg-red-50 border-b border-red-100 max-h-48 overflow-y-auto">
          <p className="text-sm text-red-700 whitespace-pre-wrap">{simulation.error}</p>
        </div>
      )}

      {/* Playback controls */}
      {simulation.steps.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              {getStatusLabel(simulation.status)}
            </span>
            <span className="text-xs text-gray-400">
              Step {simulation.currentStepIndex + 1} of {simulation.steps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${simulation.progress * 100}%` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={simulation.stepBackward}
              disabled={!simulation.canStepBackward}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Previous step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {simulation.isPlaying ? (
              <button
                onClick={simulation.pause}
                className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                title="Pause"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            ) : (
              <button
                onClick={simulation.play}
                className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600"
                title="Play"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}

            <button
              onClick={simulation.stop}
              disabled={simulation.status === 'idle'}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>

            <button
              onClick={simulation.stepForward}
              disabled={!simulation.canStepForward}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Next step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step list */}
      <div ref={stepListRef} className="flex-1 overflow-y-auto p-3">
        {simulation.steps.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <p>Enter a scenario to generate flow steps</p>
          </div>
        ) : (
          <div className="space-y-2">
            {simulation.steps.map((step, index) => {
              const node = nodes.find((n) => n.id === step.nodeId);
              const isActive = index === simulation.currentStepIndex;
              const isPast = index < simulation.currentStepIndex;

              return (
                <button
                  key={index}
                  onClick={() => simulation.goToStep(index)}
                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                      : isPast
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : isPast
                          ? 'bg-gray-300 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">
                        {node?.data.label || step.nodeId}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clarification dialog - pinned at bottom */}
      {simulation.status === 'clarifying' && simulation.clarificationQuestion && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-100">
          <p className="text-sm text-yellow-800 mb-2">
            {simulation.clarificationQuestion}
          </p>
          <form onSubmit={handleClarification} className="flex gap-2">
            <input
              type="text"
              value={clarificationInput}
              onChange={(e) => setClarificationInput(e.target.value)}
              placeholder="Your answer..."
              className="flex-1 px-2 py-1 text-sm border border-yellow-200 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={!clarificationInput.trim()}
              className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Answer
            </button>
          </form>
        </div>
      )}

      {/* Keyboard hints */}
      {simulation.steps.length > 0 && (
        <div className="p-2 border-t border-gray-100 text-[10px] text-gray-400 flex justify-center gap-3">
          <span><kbd className="px-1 bg-gray-100 rounded">↑</kbd><kbd className="px-1 bg-gray-100 rounded">↓</kbd> navigate</span>
          <span><kbd className="px-1 bg-gray-100 rounded">Space</kbd> play/pause</span>
        </div>
      )}
    </div>
  );
}
