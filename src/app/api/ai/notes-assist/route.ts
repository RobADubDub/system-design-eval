import { generateObject } from 'ai';
import { z } from 'zod';
import { logLLMRequest, logLLMResponse } from '@/lib/llmLogger';
import { getModel } from '@/lib/ai/provider';
import { DEFAULT_MODEL } from '@/lib/ai/models';

// Schema for validation response
const ValidationResultSchema = z.object({
  covered: z.array(z.string()).describe('What the user covered well (brief phrases)'),
  missing: z.array(z.string()).describe('Important considerations they may have missed (brief phrases)'),
  suggestions: z.array(z.string()).describe('Improvement tips (1-2 sentences each)'),
});

// Schema for hint response - all three levels at once
const HintResultSchema = z.object({
  level1: z.string().describe('General guidance - what categories to consider for this section type, without system-specific answers. Use markdown formatting with **bold** for emphasis and line breaks between points.'),
  level2: z.string().describe('System-specific guidance - what considerations matter for THIS type of system, with guiding questions. Use markdown formatting with **bold** for categories and line breaks between points.'),
  level3: z.string().describe('Detailed suggestions - specific things a strong answer would include, with concrete examples. Use markdown formatting with **bold** for categories and line breaks between points.'),
});

// Schema for scenario suggestions
const ScenarioSuggestionsSchema = z.object({
  scenarios: z.array(z.string()).describe('4-6 relevant user flow scenarios for this system, each 3-6 words'),
});

// Build validation prompt based on section
function buildValidationPrompt(problemStatement: string, sectionTitle: string, userContent: string): string {
  return `You are a system design interview coach. The candidate is designing:

"${problemStatement}"

Evaluate their "${sectionTitle}" section. Based on the system they're designing, identify:
1. What considerations they covered well (be specific and encouraging)
2. Important considerations they may have missed (focus on the most critical ones)
3. Brief suggestions for improvement

Be encouraging but thorough. Focus on teaching patterns relevant to this system type.
Keep each item concise - phrases or 1-2 sentences max.

Their response:
${userContent || '(empty - they haven\'t written anything yet)'}`;
}

// Build hint prompt - generates all three levels at once for cohesion
function buildHintPrompt(
  problemStatement: string,
  sectionTitle: string,
  userContent?: string
): string {
  const userContentSection = userContent
    ? `\n\nWhat they've written so far:\n${userContent}`
    : '';

  return `You are a system design interview coach. The candidate is designing:

"${problemStatement}"

Generate three progressive hint levels for the "${sectionTitle}" section. Each level should build on the previous, becoming more specific.

**IMPORTANT FORMATTING**: Use markdown formatting in your responses:
- Use **bold** for category names/headings
- Put each category or main point on its own line (use actual line breaks, not \\n)
- Use bullet points (-) for lists when appropriate

**Level 1 - General Guidance**: What general categories should someone think about for this section type? Use questions to prompt thinking. Don't give system-specific answers yet.

**Level 2 - System-Specific**: What considerations are particularly important for THIS type of system? Help them understand what makes this system unique. Ask guiding questions specific to this system.

**Level 3 - Detailed Suggestions**: What would a strong answer include? Be specific with concrete examples. This is the "reveal" level. Format as categories with details.

Keep each level to 3-5 bullet points or categories. Make them cohesive - level 2 should naturally follow from level 1, and level 3 should expand on level 2.${userContentSection}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, model } = body;
    const modelId = model || DEFAULT_MODEL;

    if (mode === 'validate') {
      const { problemStatement, sectionId, sectionTitle, userContent } = body;

      if (!problemStatement) {
        return new Response(
          JSON.stringify({ error: 'Problem statement is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const prompt = buildValidationPrompt(problemStatement, sectionTitle, userContent);

      const { startTime } = logLLMRequest('notes-assist', {
        mode: 'validate',
        sectionId,
        sectionTitle,
        problemStatementLength: problemStatement.length,
        userContentLength: userContent?.length || 0,
        prompt,
      });

      const { object } = await generateObject({
        model: getModel(modelId),
        prompt,
        schema: ValidationResultSchema,
        maxOutputTokens: 1024,
      });

      logLLMResponse('notes-assist', {
        success: true,
        mode: 'validate',
        coveredCount: object.covered.length,
        missingCount: object.missing.length,
        suggestionsCount: object.suggestions.length,
      }, startTime);

      return new Response(JSON.stringify(object), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'hint') {
      const { problemStatement, sectionId, sectionTitle, userContent } = body;

      if (!problemStatement) {
        return new Response(
          JSON.stringify({ error: 'Problem statement is required for hints' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const prompt = buildHintPrompt(problemStatement, sectionTitle, userContent);

      const { startTime } = logLLMRequest('notes-assist', {
        mode: 'hint',
        sectionId,
        sectionTitle,
        problemStatementLength: problemStatement.length,
        prompt,
      });

      const { object } = await generateObject({
        model: getModel(modelId),
        prompt,
        schema: HintResultSchema,
        maxOutputTokens: 2048,
      });

      logLLMResponse('notes-assist', {
        success: true,
        mode: 'hint',
        level1Length: object.level1.length,
        level2Length: object.level2.length,
        level3Length: object.level3.length,
      }, startTime);

      return new Response(JSON.stringify(object), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'scenarios') {
      const { problemStatement } = body;

      if (!problemStatement) {
        return new Response(
          JSON.stringify({ error: 'Problem statement is required for scenario suggestions' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const prompt = `You are a system design expert. Given this system being designed:

"${problemStatement}"

Generate 4-6 realistic user flow scenarios that would be useful to simulate in an architecture diagram. These should represent common user journeys or system processes.

Examples of good scenarios:
- For a video platform: "User uploads a video", "User watches a video", "User searches for content"
- For a ride-sharing app: "Rider requests a ride", "Driver accepts request", "Payment processing"

Keep each scenario concise (3-6 words) and action-oriented.`;

      const { startTime } = logLLMRequest('notes-assist', {
        mode: 'scenarios',
        problemStatementLength: problemStatement.length,
        prompt,
      });

      const { object } = await generateObject({
        model: getModel(modelId),
        prompt,
        schema: ScenarioSuggestionsSchema,
        maxOutputTokens: 512,
      });

      logLLMResponse('notes-assist', {
        success: true,
        mode: 'scenarios',
        scenarioCount: object.scenarios.length,
      }, startTime);

      return new Response(JSON.stringify(object), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode. Use "validate", "hint", or "scenarios".' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notes assist API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process notes assist request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
