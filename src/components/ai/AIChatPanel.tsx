'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { CloudNode, DiagramEdge, DiagramNotes } from '@/types/diagram';
import {
  serializeDiagramForAI,
  serializeSelectedNode,
  serializeNotesForAI,
} from '@/lib/ai/diagramSerializer';

interface Insight {
  nodeId: string | null;
  component: string;
  category: string;
  details: string;
}

interface ChatExchange {
  id: string;
  question: string;
  insights: Insight[];
  isLoading: boolean;
}

interface AIChatPanelProps {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  selectedNodes: CloudNode[];
  notes?: DiagramNotes;
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
}

// Quick action templates - {components} is replaced with selected component context
const quickActionTemplates = [
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
}: AIChatPanelProps) {
  const [exchanges, setExchanges] = useState<ChatExchange[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Serialize diagram context with all selected node IDs
  const selectedNodeIds = selectedNodes.map((n) => n.id);
  const diagramContext = serializeDiagramForAI(nodes, edges, selectedNodeIds);
  const selectedNodesContext = selectedNodes.length > 0
    ? selectedNodes.map((n) => serializeSelectedNode(n)).join('\n\n')
    : undefined;
  const notesContext = notes ? serializeNotesForAI(notes) : undefined;

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
    setExchanges((prev) => [
      ...prev,
      { id: exchangeId, question: content, insights: [], isLoading: true },
    ]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Build messages from previous exchanges for context
      const messages = exchanges.flatMap((ex) => [
        { role: 'user', content: ex.question },
        { role: 'assistant', content: JSON.stringify({ insights: ex.insights }) },
      ]);
      messages.push({ role: 'user', content });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          diagramContext,
          selectedNodeContext: selectedNodesContext,
          notesContext,
        }),
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
          if (parsed.insights && Array.isArray(parsed.insights)) {
            setExchanges((prev) =>
              prev.map((ex) =>
                ex.id === exchangeId ? { ...ex, insights: parsed.insights } : ex
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
        if (finalData.insights) {
          setExchanges((prev) =>
            prev.map((ex) =>
              ex.id === exchangeId
                ? { ...ex, insights: finalData.insights, isLoading: false }
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
      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === exchangeId
            ? {
                ...ex,
                insights: [
                  {
                    nodeId: null,
                    component: 'Error',
                    category: 'Error',
                    details: 'Sorry, I encountered an error. Please try again.',
                  },
                ],
                isLoading: false,
              }
            : ex
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Build context-aware prompt from quick action template
  const buildQuickActionPrompt = (template: typeof quickActionTemplates[0]) => {
    if (selectedNodes.length === 0) {
      return template.base + '?';
    }
    const componentNames = selectedNodes.length === 1
      ? selectedNodes[0].data.label
      : selectedNodes.map((n) => n.data.label).join(', ');
    return template.focused.replace('{components}', componentNames) + '?';
  };

  // Handle quick action click - populate input with context-aware prompt
  const handleQuickAction = (template: typeof quickActionTemplates[0]) => {
    setInput(buildQuickActionPrompt(template));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      const message = input;
      setInput('');
      sendMessage(message);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  // Handle clicking on a component in the insights
  const handleInsightClick = (nodeId: string | null) => {
    if (nodeId && onFocusNode) {
      onFocusNode(nodeId);
    }
  };

  const clearChat = () => {
    setExchanges([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">AI</span>
          <span className="font-medium text-gray-800 text-sm">
            Design Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          {exchanges.length > 0 && (
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

      {/* Selected components indicator */}
      {selectedNodes.length > 0 && (
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

      {/* Quick actions */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {quickActionTemplates.map((template) => (
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

      {/* Chat exchanges */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {exchanges.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <p>Ask questions about your system design</p>
            <p className="text-xs mt-1">Responses appear as structured insights</p>
          </div>
        )}

        {exchanges.map((exchange) => (
          <div key={exchange.id} className="space-y-2">
            {/* User question */}
            <div className="ml-4">
              <div className="px-3 py-2 rounded-lg text-sm bg-blue-500 text-white">
                {exchange.question}
              </div>
            </div>

            {/* Insights table */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {exchange.isLoading && exchange.insights.length === 0 ? (
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
                    {exchange.insights.map((insight, index) => (
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
              {exchange.isLoading && exchange.insights.length > 0 && (
                <div className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] text-center">
                  Loading more insights...
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              nodes.length === 0
                ? 'Add components to your diagram first'
                : selectedNodes.length === 1
                ? `Ask about ${selectedNodes[0].data.label}...`
                : selectedNodes.length > 1
                ? `Ask about ${selectedNodes.length} selected components...`
                : 'Ask about your system design...'
            }
            disabled={isLoading || nodes.length === 0}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
          />
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
              disabled={!input.trim() || nodes.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
