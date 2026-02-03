import { streamText, generateText, streamObject } from 'ai';
import { z } from 'zod';
import {
  ANALYSIS_PROMPT,
  STRUCTURED_ANALYSIS_PROMPT,
  FLOW_GENERATION_PROMPT,
  buildAnalysisContext,
  buildFlowContext,
} from '@/lib/ai/prompts';
import { logLLMRequest, logLLMResponse } from '@/lib/llmLogger';
import { getModel } from '@/lib/ai/provider';
import { DEFAULT_MODEL } from '@/lib/ai/models';

// Schema for structured analysis findings
const AnalysisFindingSchema = z.object({
  nodeId: z.string().nullable().describe('The ID of the component from the diagram, or null for system-wide issues'),
  component: z.string().describe('The label/name of the component, or "System" for system-wide issues'),
  category: z.enum(['Bottleneck', 'Single Point of Failure', 'Missing Component', 'Security', 'Scalability']).describe('The type of issue'),
  severity: z.enum(['Low', 'Medium', 'High']).describe('How severe the issue is'),
  details: z.string().describe('A brief explanation of the issue (1-2 sentences)'),
});

const AnalysisResultSchema = z.object({
  findings: z.array(AnalysisFindingSchema).describe('List of findings from the analysis'),
});

export async function POST(req: Request) {
  try {
    const { mode, diagramContext, flowDiagramContext, scenario, notesContext, model } = await req.json();
    const modelId = model || DEFAULT_MODEL;

    if (mode === 'analyze') {
      // Full system analysis with streaming
      const context = buildAnalysisContext(diagramContext, notesContext);

      const { startTime } = logLLMRequest('analyze', {
        mode: 'analyze (streaming)',
        systemPrompt: ANALYSIS_PROMPT,
        userPrompt: context,
      });

      const result = streamText({
        model: getModel(modelId),
        system: ANALYSIS_PROMPT,
        messages: [{ role: 'user', content: context }],
        maxOutputTokens: 4096,
        onFinish: ({ text }) => {
          logLLMResponse('analyze', {
            success: true,
            responseLength: text.length,
            response: text,
          }, startTime);
        },
      });

      return result.toTextStreamResponse();
    }

    if (mode === 'structured-analyze') {
      // Structured analysis using streamObject for progressive updates
      const context = buildAnalysisContext(diagramContext, notesContext);

      const { startTime } = logLLMRequest('analyze', {
        mode: 'structured-analyze (streaming)',
        systemPrompt: STRUCTURED_ANALYSIS_PROMPT,
        userPrompt: context,
      });

      const result = streamObject({
        model: getModel(modelId),
        system: STRUCTURED_ANALYSIS_PROMPT,
        prompt: context,
        schema: AnalysisResultSchema,
        maxOutputTokens: 4096,
        onFinish: ({ object }) => {
          logLLMResponse('analyze', {
            success: true,
            findingsCount: object?.findings?.length ?? 0,
            findings: object?.findings ?? [],
          }, startTime);
        },
      });

      return result.toTextStreamResponse();
    }

    if (mode === 'flow') {
      // Flow generation - non-streaming for JSON response
      const context = buildFlowContext(flowDiagramContext, scenario, notesContext);

      const { startTime } = logLLMRequest('flow', {
        mode: 'flow',
        scenario,
        systemPrompt: FLOW_GENERATION_PROMPT,
        userPrompt: context,
      });

      const result = await generateText({
        model: getModel(modelId),
        system: FLOW_GENERATION_PROMPT,
        messages: [{ role: 'user', content: context }],
        maxOutputTokens: 2048,
      });

      // Try to parse JSON from the response
      const text = result.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const flowData = JSON.parse(jsonMatch[0]);
        logLLMResponse('flow', {
          success: true,
          rawText: text,
          parsed: flowData,
        }, startTime);
        return new Response(JSON.stringify(flowData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logLLMResponse('flow', {
        success: false,
        error: 'Failed to parse JSON from response',
        rawText: text,
      }, startTime);

      return new Response(
        JSON.stringify({ error: 'Failed to parse flow response' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process analysis request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
