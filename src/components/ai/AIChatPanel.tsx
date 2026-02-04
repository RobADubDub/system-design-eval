'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { CloudNode, DiagramEdge, DiagramNotes } from '@/types/diagram';
import {
  serializeDiagramForAI,
  serializeSelectedNode,
  serializeNotesForAI,
} from '@/lib/ai/diagramSerializer';
import { useSettings } from '@/components/settings/SettingsContext';

// Response format for design mode (tabular insights)
export interface Insight {
  nodeId: string | null;
  component: string;
  category: string;
  details: string;
}

export type AIChatMode = 'design' | 'notes';

// Chat exchange can have either insights (design mode) or text response (notes mode)
export interface ChatExchange {
  id: string;
  mode: AIChatMode; // Track which mode this exchange belongs to
  question: string;
  insights?: Insight[];
  textResponse?: string;
  isLoading: boolean;
}

export interface NotesContext {
  sectionId: string;
  sectionTitle: string;
  sectionContent: string;
  problemStatement: string;
}

interface AIChatPanelProps {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  selectedNodes: CloudNode[];
  notes?: DiagramNotes;
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
  // Mode support
  mode: AIChatMode;
  onModeChange?: (mode: AIChatMode) => void;
  notesContext?: NotesContext;
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  // Lifted state for persistence across panel close/open
  exchanges: ChatExchange[];
  onExchangesChange: (exchanges: ChatExchange[] | ((prev: ChatExchange[]) => ChatExchange[])) => void;
}

// Quick action templates for design mode
const designQuickActions = [
  { label: 'Find bottlenecks', base: 'What are the potential bottlenecks', focused: 'What are the potential bottlenecks for {components}' },
  { label: 'Suggest improvements', base: 'What improvements would you suggest', focused: 'What improvements would you suggest for {components}' },
  { label: 'Check redundancy', base: 'Are there any single points of failure', focused: 'Are there any single points of failure related to {components}' },
  { label: 'Security review', base: 'What security concerns should I consider', focused: 'What security concerns should I consider for {components}' },
];

export function AIChatPanel({
  nodes,
  edges,
  selectedNodes,
  notes,
  onClose,
  onFocusNode,
  mode,
  onModeChange,
  notesContext,
  initialMessage,
  onInitialMessageSent,
  exchanges,
  onExchangesChange,
}: AIChatPanelProps) {
  const { settings } = useSettings();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevModeRef = useRef<AIChatMode>(mode);
  const initialMessageSentRef = useRef(false);

  // Serialize diagram context for design mode
  const selectedNodeIds = selectedNodes.map((n) => n.id);
  const diagramContext = serializeDiagramForAI(nodes, edges, selectedNodeIds);
  const selectedNodesContext = selectedNodes.length > 0
    ? selectedNodes.map((n) => serializeSelectedNode(n)).join('\n\n')
    : undefined;
  const fullNotesContext = notes ? serializeNotesForAI(notes) : undefined;

  // Track mode changes (but don't clear conversation - user can do that manually)
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      initialMessageSentRef.current = false;
      prevModeRef.current = mode;
    }
  }, [mode]);

  // Handle initial message (e.g., from "Get Hint" button)
  // This clears the current mode's conversation and starts fresh with the new context
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current && !isLoading) {
      initialMessageSentRef.current = true;
      // Clear only the current mode's exchanges for new context
      onExchangesChange((prev) => prev.filter((ex) => ex.mode !== mode));
      sendMessage(initialMessage);
      onInitialMessageSent?.();
    }
  }, [initialMessage, isLoading, mode]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Send a message to the chat API
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const exchangeId = crypto.randomUUID();

    // Add new exchange with loading state
    onExchangesChange((prev) => [
      ...prev,
      { id: exchangeId, mode, question: content, isLoading: true },
    ]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Build messages from previous exchanges for context (only from current mode)
      const currentModeExchanges = exchanges.filter((ex) => ex.mode === mode);
      const messages = currentModeExchanges.flatMap((ex) => [
        { role: 'user', content: ex.question },
        { role: 'assistant', content: ex.insights
          ? JSON.stringify({ insights: ex.insights })
          : ex.textResponse || ''
        },
      ]);
      messages.push({ role: 'user', content });

      // Build request body based on mode
      const requestBody = mode === 'design'
        ? {
            messages,
            diagramContext,
            selectedNodeContext: selectedNodesContext,
            notesContext: fullNotesContext,
            model: settings.selectedModel,
            chatMode: 'design',
          }
        : {
            messages,
            notesContext: notesContext ? {
              problemStatement: notesContext.problemStatement,
              sectionId: notesContext.sectionId,
              sectionTitle: notesContext.sectionTitle,
              sectionContent: notesContext.sectionContent,
              allNotes: fullNotesContext,
            } : undefined,
            model: settings.selectedModel,
            chatMode: 'notes',
          };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        // Try to parse the accumulated JSON progressively
        try {
          const parsed = JSON.parse(accumulatedText);

          if (mode === 'design' && parsed.insights && Array.isArray(parsed.insights)) {
            onExchangesChange((prev) =>
              prev.map((ex) =>
                ex.id === exchangeId ? { ...ex, insights: parsed.insights } : ex
              )
            );
          } else if (mode === 'notes' && parsed.response) {
            onExchangesChange((prev) =>
              prev.map((ex) =>
                ex.id === exchangeId ? { ...ex, textResponse: parsed.response } : ex
              )
            );
          }
        } catch {
          // JSON not complete yet, continue accumulating
        }
      }

      // Final parse
      try {
        const finalData = JSON.parse(accumulatedText);

        if (mode === 'design' && finalData.insights) {
          onExchangesChange((prev) =>
            prev.map((ex) =>
              ex.id === exchangeId
                ? { ...ex, insights: finalData.insights, isLoading: false }
                : ex
            )
          );
        } else if (mode === 'notes' && finalData.response) {
          onExchangesChange((prev) =>
            prev.map((ex) =>
              ex.id === exchangeId
                ? { ...ex, textResponse: finalData.response, isLoading: false }
                : ex
            )
          );
        }
      } catch {
        throw new Error('Failed to parse response');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      const errorResponse = mode === 'design'
        ? {
            insights: [{
              nodeId: null,
              component: 'Error',
              category: 'Error',
              details: 'Sorry, I encountered an error. Please try again.',
            }],
            isLoading: false,
          }
        : {
            textResponse: 'Sorry, I encountered an error. Please try again.',
            isLoading: false,
          };

      onExchangesChange((prev) =>
        prev.map((ex) =>
          ex.id === exchangeId ? { ...ex, ...errorResponse } : ex
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Build context-aware prompt from quick action template (design mode)
  const buildQuickActionPrompt = (template: typeof designQuickActions[0]) => {
    if (selectedNodes.length === 0) {
      return template.base + '?';
    }
    const componentNames = selectedNodes.length === 1
      ? selectedNodes[0].data.label
      : selectedNodes.map((n) => n.data.label).join(', ');
    return template.focused.replace('{components}', componentNames) + '?';
  };

  const handleQuickAction = (template: typeof designQuickActions[0]) => {
    setInput(buildQuickActionPrompt(template));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  const submitMessage = () => {
    if (input.trim() && !isLoading && canSendMessage) {
      const message = input;
      setInput('');
      sendMessage(message);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift submits, Shift+Enter creates new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleInsightClick = (nodeId: string | null) => {
    if (nodeId && onFocusNode) {
      onFocusNode(nodeId);
    }
  };

  const clearChat = () => {
    // Only clear exchanges for the current mode
    onExchangesChange((prev) => prev.filter((ex) => ex.mode !== mode));
  };

  // Filter exchanges to only show current mode's conversation
  const currentModeExchanges = exchanges.filter((ex) => ex.mode === mode);

  // Determine header and styling based on mode
  const isNotesMode = mode === 'notes';
  const headerTitle = isNotesMode ? 'Notes Assistant' : 'Design Assistant';
  const headerColor = isNotesMode ? 'text-amber-600' : 'text-purple-600';
  const accentColor = isNotesMode ? 'bg-amber-500' : 'bg-blue-500';

  // Get placeholder text
  const getPlaceholder = () => {
    if (isNotesMode) {
      if (!notesContext?.problemStatement) {
        return 'Fill in the Problem section first...';
      }
      if (notesContext?.sectionId === 'general') {
        return 'Ask about the system design problem...';
      }
      return `Ask about ${notesContext?.sectionTitle || 'your notes'}...`;
    }
    if (nodes.length === 0) {
      return 'Add components to your diagram first';
    }
    if (selectedNodes.length === 1) {
      return `Ask about ${selectedNodes[0].data.label}...`;
    }
    if (selectedNodes.length > 1) {
      return `Ask about ${selectedNodes.length} selected components...`;
    }
    return 'Ask about your system design...';
  };

  const canSendMessage = isNotesMode
    ? !!notesContext?.problemStatement
    : nodes.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${headerColor}`}>
              {isNotesMode ? '📝' : '🤖'}
            </span>
            <span className="font-medium text-gray-800 text-sm">
              {headerTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {currentModeExchanges.length > 0 && (
              <button
                onClick={clearChat}
                className="text-gray-400 hover:text-gray-600 p-1 text-xs"
                title="Clear chat"
              >
                Clear
              </button>
            )}
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
        </div>

        {/* Mode toggle */}
        {onModeChange && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange('notes')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                isNotesMode
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => onModeChange('design')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                !isNotesMode
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Design
            </button>
          </div>
        )}
      </div>

      {/* Context indicator - only for design mode with selected nodes */}
      {!isNotesMode && selectedNodes.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
          <span className="text-xs text-blue-600">
            {selectedNodes.length === 1 ? (
              <>Focused on: <strong>{selectedNodes[0].data.label}</strong></>
            ) : (
              <>Focused on <strong>{selectedNodes.length} components</strong></>
            )}
          </span>
        </div>
      )}

      {/* Quick actions (design mode only) */}
      {!isNotesMode && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {designQuickActions.map((template) => (
              <button
                key={template.label}
                onClick={() => handleQuickAction(template)}
                disabled={isLoading || nodes.length === 0}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat exchanges */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {currentModeExchanges.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            {isNotesMode ? (
              <>
                <p>Ask questions about the system design</p>
                <p className="text-xs mt-1">Clarify requirements, get hints, or validate your notes</p>
              </>
            ) : (
              <>
                <p>Ask questions about your system design</p>
                <p className="text-xs mt-1">Responses appear as structured insights</p>
              </>
            )}
          </div>
        )}

        {currentModeExchanges.map((exchange) => (
          <div key={exchange.id} className="space-y-2">
            {/* User question */}
            <div className="ml-4">
              <div className={`px-3 py-2 rounded-lg text-sm ${accentColor} text-white`}>
                {exchange.question}
              </div>
            </div>

            {/* Response - different format based on mode */}
            {isNotesMode ? (
              // Notes mode: markdown response
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                {exchange.isLoading && !exchange.textResponse ? (
                  <div className="text-center text-gray-500 text-sm">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        h3: ({ children }) => <h3 className="font-semibold text-gray-800 mt-3 mb-1">{children}</h3>,
                        h4: ({ children }) => <h4 className="font-medium text-gray-700 mt-2 mb-1">{children}</h4>,
                      }}
                    >
                      {exchange.textResponse || ''}
                    </ReactMarkdown>
                  </div>
                )}
                {exchange.isLoading && exchange.textResponse && (
                  <div className="mt-2 text-xs text-amber-600 animate-pulse">
                    Continuing...
                  </div>
                )}
              </div>
            ) : (
              // Design mode: insights table
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {exchange.isLoading && (!exchange.insights || exchange.insights.length === 0) ? (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    <div className="animate-pulse">Analyzing...</div>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 w-24">Component</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 w-20">Category</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {exchange.insights?.map((insight, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-white ${insight.nodeId ? 'cursor-pointer' : ''}`}
                          onClick={() => handleInsightClick(insight.nodeId)}
                        >
                          <td className="px-2 py-1.5">
                            <span className={`${insight.nodeId ? 'text-blue-600 hover:underline' : 'text-gray-700'}`}>
                              {insight.component}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-700">
                              {insight.category}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-gray-600">{insight.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {exchange.isLoading && exchange.insights && exchange.insights.length > 0 && (
                  <div className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] text-center">
                    Loading more insights...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-3 border-t border-gray-200">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isLoading || !canSendMessage}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 resize-y min-h-[72px] max-h-[200px]"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-gray-400">
            Enter to send, Shift+Enter for new line
          </p>
          <div className="flex gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !canSendMessage}
                className={`px-3 py-1.5 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  isNotesMode
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Send
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
