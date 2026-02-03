import { streamObject } from 'ai';
import { z } from 'zod';
import {
  STRUCTURED_CHAT_PROMPT,
  buildChatContext,
} from '@/lib/ai/prompts';
import { logLLMRequest, logLLMResponse } from '@/lib/llmLogger';
import { getModel } from '@/lib/ai/provider';
import { DEFAULT_MODEL } from '@/lib/ai/models';

// Schema for structured chat responses - every response is tabular
const ChatResponseSchema = z.object({
  insights: z.array(z.object({
    nodeId: z.string().nullable().describe('The component ID from the diagram, or null for system-wide insights'),
    component: z.string().describe('The component name, or "General" for system-wide insights'),
    category: z.string().describe('The type of insight (e.g., Bottleneck, Security, Performance, Recommendation, Answer, etc.)'),
    details: z.string().describe('The insight or answer (1-3 sentences)'),
  })).describe('List of insights, observations, or answers as table rows'),
});

export async function POST(req: Request) {
  try {
    const { messages, diagramContext, selectedNodeContext, notesContext, model } = await req.json();
    const modelId = model || DEFAULT_MODEL;

    // Build the full context for the AI
    const context = buildChatContext(diagramContext, selectedNodeContext, notesContext);

    // Create the system message with context
    const systemMessage = `${STRUCTURED_CHAT_PROMPT}\n\n${context}`;

    // Build the conversation as a single prompt (last user message is the question)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const conversationHistory = messages.slice(0, -1)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = conversationHistory
      ? `Previous conversation:\n${conversationHistory}\n\nCurrent question: ${lastUserMessage}`
      : lastUserMessage;

    const { startTime } = logLLMRequest('chat', {
      mode: 'chat (structured streaming)',
      messagesCount: messages?.length || 0,
      hasSelectedNodes: !!selectedNodeContext,
      systemPrompt: systemMessage,
      prompt: prompt,
      schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nodeId: { type: 'string', nullable: true, description: 'Component ID or null' },
                component: { type: 'string', description: 'Component name or "General"' },
                category: { type: 'string', description: 'Insight type (Bottleneck, Security, etc.)' },
                details: { type: 'string', description: 'The insight (1-3 sentences)' },
              },
            },
          },
        },
      },
    });

    const result = streamObject({
      model: getModel(modelId),
      system: systemMessage,
      prompt: prompt,
      schema: ChatResponseSchema,
      maxOutputTokens: 2048,
      onFinish: ({ object }) => {
        logLLMResponse('chat', {
          success: true,
          insightsCount: object?.insights?.length ?? 0,
          insights: object?.insights ?? [],
        }, startTime);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
