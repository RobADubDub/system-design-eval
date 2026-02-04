import { streamObject } from 'ai';
import { z } from 'zod';
import {
  STRUCTURED_CHAT_PROMPT,
  NOTES_CHAT_PROMPT,
  buildChatContext,
  buildNotesContext,
  NotesContextData,
} from '@/lib/ai/prompts';
import { logLLMRequest, logLLMResponse } from '@/lib/llmLogger';
import { getModel } from '@/lib/ai/provider';
import { DEFAULT_MODEL } from '@/lib/ai/models';

// Schema for design mode - structured insights
const DesignChatResponseSchema = z.object({
  insights: z.array(z.object({
    nodeId: z.string().nullable().describe('The component ID from the diagram, or null for system-wide insights'),
    component: z.string().describe('The component name, or "General" for system-wide insights'),
    category: z.string().describe('The type of insight (e.g., Bottleneck, Security, Performance, Recommendation, Answer, etc.)'),
    details: z.string().describe('The insight or answer (1-3 sentences)'),
  })).describe('List of insights, observations, or answers as table rows'),
});

// Schema for notes mode - conversational response
const NotesChatResponseSchema = z.object({
  response: z.string().describe('A helpful, conversational response using markdown formatting. Be educational and encouraging.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      diagramContext,
      selectedNodeContext,
      notesContext,
      model,
      chatMode = 'design',
    } = body;
    const modelId = model || DEFAULT_MODEL;

    if (chatMode === 'notes') {
      // Notes mode - conversational assistant for design notes
      const notesData = notesContext as NotesContextData | undefined;

      if (!notesData?.problemStatement) {
        return new Response(
          JSON.stringify({ error: 'Problem statement is required for notes assistance' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const context = buildNotesContext(notesData);
      const systemMessage = `${NOTES_CHAT_PROMPT}\n\n${context}`;

      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const conversationHistory = messages.slice(0, -1)
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join('\n');

      const prompt = conversationHistory
        ? `Previous conversation:\n${conversationHistory}\n\nUser: ${lastUserMessage}`
        : lastUserMessage;

      const { startTime } = logLLMRequest('chat', {
        mode: 'notes (conversational)',
        messagesCount: messages?.length || 0,
        sectionId: notesData.sectionId,
        systemPrompt: systemMessage,
        prompt: prompt,
      });

      const result = streamObject({
        model: getModel(modelId),
        system: systemMessage,
        prompt: prompt,
        schema: NotesChatResponseSchema,
        maxOutputTokens: 2048,
        onFinish: ({ object }) => {
          logLLMResponse('chat', {
            success: true,
            mode: 'notes',
            responseLength: object?.response?.length ?? 0,
          }, startTime);
        },
      });

      return result.toTextStreamResponse();
    }

    // Design mode - structured insights (existing behavior)
    const context = buildChatContext(diagramContext, selectedNodeContext, notesContext);
    const systemMessage = `${STRUCTURED_CHAT_PROMPT}\n\n${context}`;

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
      schema: DesignChatResponseSchema,
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
