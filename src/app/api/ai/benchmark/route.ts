import { generateObject } from 'ai';
import { z } from 'zod';
import { logLLMRequest, logLLMResponse } from '@/lib/llmLogger';
import { getModel } from '@/lib/ai/provider';
import { DEFAULT_MODEL } from '@/lib/ai/models';
import { serializeDiagramForAI, serializeNotesForAI } from '@/lib/ai/diagramSerializer';
import { BenchmarkRequest, BenchmarkTopologySummary, BenchmarkProfile, InsightFacet, ReferenceGraph } from '@/types/benchmark';
import { CloudNodeType } from '@/types/diagram';

const ALLOWED_NODE_TYPES: CloudNodeType[] = [
  'loadBalancer',
  'service',
  'database',
  'queue',
  'client',
  'cache',
  'serverlessFunction',
  'container',
  'blobStorage',
  'cdn',
  'eventStream',
  'workflow',
  'notification',
  'scheduler',
  'apiGateway',
  'text',
];

const FACETS: InsightFacet[] = ['scale', 'operational', 'reliability', 'cost', 'complexity'];

const ReferenceNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  facets: z.object({
    scale: z.string().optional(),
    operational: z.string().optional(),
    reliability: z.string().optional(),
    cost: z.string().optional(),
    complexity: z.string().optional(),
  }).optional(),
});

const ReferenceEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

const ReferenceGenerationSchema = z.object({
  summary: z.string(),
  referenceGraph: z.object({
    nodes: z.array(ReferenceNodeSchema),
    edges: z.array(ReferenceEdgeSchema),
  }),
});

const ScoreSchema = z.object({
  functional: z.number(),
  scalability: z.number(),
  reliability: z.number(),
  operability: z.number(),
  costEfficiency: z.number(),
  complexityRisk: z.number(),
});

const TopGapSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  rationale: z.string(),
});

const DeltaSchema = z.object({
  type: z.enum(['missing', 'overbuilt', 'risky_coupling', 'spof']),
  component: z.string(),
  detail: z.string(),
});

const ScenarioMetricEntrySchema = z.object({
  p95Ms: z.number(),
  errorRatePct: z.number(),
  recoveryMin: z.number(),
  opsBurden: z.number(),
});

const ScenarioMetricSchema = z.object({
  scenario: z.enum(['normal', 'spike_10x', 'service_failure', 'queue_backlog', 'region_degradation']),
  user: ScenarioMetricEntrySchema,
  reference: ScenarioMetricEntrySchema,
});

const DecisionSchema = z.object({
  id: z.string(),
  yourDecision: z.string(),
  whereItWorks: z.string(),
  failureMode: z.string(),
  whyReferenceDiffers: z.string(),
  upgradePath: z.array(z.string()),
});

const InsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  facet: z.enum(['scale', 'operational', 'reliability', 'cost', 'complexity']),
  status: z.enum(['missing', 'partial', 'aligned']),
  summary: z.string(),
  detail: z.string(),
  referenceNodeIds: z.array(z.string()),
});

const CompareSchema = z.object({
  scores: ScoreSchema,
  topGaps: z.array(TopGapSchema),
  deltas: z.array(DeltaSchema),
  scenarioMetrics: z.array(ScenarioMetricSchema),
  decisions: z.array(DecisionSchema),
  insights: z.array(InsightSchema),
});

const REQUIRED_SCENARIOS: Array<'normal' | 'spike_10x' | 'service_failure' | 'queue_backlog' | 'region_degradation'> = [
  'normal',
  'spike_10x',
  'service_failure',
  'queue_backlog',
  'region_degradation',
];

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ensureNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Number(value.toFixed(2)));
}

function getUserTopology(request: BenchmarkRequest): BenchmarkTopologySummary {
  const byType = request.diagram.nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return {
    byType,
    nodeCount: request.diagram.nodes.length,
    edgeCount: request.diagram.edges.length,
  };
}

function getReferenceTopology(referenceGraph: ReferenceGraph): BenchmarkTopologySummary {
  const byType = referenceGraph.nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return {
    byType,
    nodeCount: referenceGraph.nodes.length,
    edgeCount: referenceGraph.edges.length,
  };
}

function sanitizeId(id: string, fallback: string): string {
  const cleaned = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeReferenceGraph(graph: z.infer<typeof ReferenceGenerationSchema>['referenceGraph']): ReferenceGraph {
  const used = new Set<string>();
  const nodes = graph.nodes.slice(0, 24).map((node, index) => {
    const base = sanitizeId(node.id, `ref-node-${index + 1}`);
    let id = base;
    let suffix = 1;
    while (used.has(id)) {
      id = `${base}-${suffix++}`;
    }
    used.add(id);

    const type = ALLOWED_NODE_TYPES.includes(node.type as CloudNodeType)
      ? node.type
      : 'service';

    const facets: Partial<Record<InsightFacet, string>> = {};
    if (node.facets) {
      FACETS.forEach((facet) => {
        const value = node.facets?.[facet];
        if (value && typeof value === 'string') {
          facets[facet] = value;
        }
      });
    }

    return {
      id,
      label: node.label.trim() || `Reference ${index + 1}`,
      type,
      x: Number.isFinite(node.x) ? node.x : 120 + (index % 4) * 180,
      y: Number.isFinite(node.y) ? node.y : 90 + Math.floor(index / 4) * 140,
      facets,
    };
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges
    .slice(0, 40)
    .map((edge, index) => ({
      id: sanitizeId(edge.id, `ref-edge-${index + 1}`),
      source: sanitizeId(edge.source, ''),
      target: sanitizeId(edge.target, ''),
      label: edge.label,
    }))
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target);

  return { nodes, edges };
}

function buildReferencePrompt(request: BenchmarkRequest): string {
  const problemStatement =
    request.notes.sections.find((section) => section.id === 'problem')?.content?.trim() || '';

  return [
    'You are designing a reference system architecture for interview practice.',
    'Create a clean, teachable reference diagram for the given profile and problem.',
    'Use realistic cloud/distributed components and include operationally relevant facets on nodes.',
    '',
    `Profile: ${request.profile}`,
    `Focus area: ${request.focusArea || 'general'}`,
    '',
    'Problem statement:',
    problemStatement || '(No problem statement provided)',
    '',
    'Requirements:',
    '- Node types must be valid system components (service, database, queue, cache, loadBalancer, apiGateway, cdn, eventStream, workflow, notification, scheduler, client, etc.).',
    '- Include good x/y positions for a readable left-to-right flow.',
    '- Include concise node facet notes for scale/operational/reliability/cost/complexity where relevant.',
    '- Output must be architecture-first and interview-teachable.',
  ].join('\n');
}

function buildComparePrompt(
  request: BenchmarkRequest,
  referenceGraph: ReferenceGraph
): string {
  const referenceGraphText = [
    'Reference graph:',
    ...referenceGraph.nodes.map((node) => `- node ${node.id}: ${node.label} (${node.type})`),
    ...referenceGraph.edges.map((edge) => `- edge ${edge.id}: ${edge.source} -> ${edge.target}${edge.label ? ` (${edge.label})` : ''}`),
  ].join('\n');

  return [
    'You are an expert system design interviewer with deep operational experience.',
    'Compare the user design against the selected reference architecture.',
    '',
    `Profile: ${request.profile}`,
    `Focus area: ${request.focusArea || 'general'}`,
    '',
    'Scoring guidance:',
    '- Higher is better for functional/scalability/reliability/operability/costEfficiency.',
    '- Higher complexityRisk means more complex/riskier design.',
    '',
    'Rules:',
    '- Top gaps must be prioritized and operationally concrete.',
    '- Deltas must be architecture-specific and evidence-based.',
    '- Scenario metrics must show meaningful differences.',
    '- Insights must only reference valid referenceNodeIds listed below.',
    '',
    referenceGraphText,
    '',
    'User design:',
    serializeDiagramForAI(request.diagram.nodes, request.diagram.edges),
    '',
    'User notes:',
    serializeNotesForAI(request.notes) || '(No notes)',
  ].join('\n');
}

function parseBenchmarkRequest(body: unknown): BenchmarkRequest | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const payload = body as Record<string, unknown>;
  const diagram = payload.diagram as Record<string, unknown> | undefined;
  if (!diagram?.nodes || !diagram?.edges || !payload.notes || !payload.profile) {
    return null;
  }
  return {
    diagram: payload.diagram as BenchmarkRequest['diagram'],
    notes: payload.notes as BenchmarkRequest['notes'],
    profile: payload.profile as BenchmarkProfile,
    focusArea: payload.focusArea as BenchmarkRequest['focusArea'],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, model } = body as { mode?: 'reference' | 'compare'; model?: string };
    const modelId = model || DEFAULT_MODEL;

    if (!mode || !['reference', 'compare'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use "reference" or "compare".' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const request = parseBenchmarkRequest(body);
    if (!request) {
      return new Response(
        JSON.stringify({ error: 'Invalid benchmark request payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (request.diagram.nodes.length < 3) {
      return new Response(
        JSON.stringify({ error: 'At least 3 nodes are required for benchmark comparison.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'reference') {
      const prompt = buildReferencePrompt(request);
      const { startTime } = logLLMRequest('benchmark', {
        mode,
        modelId,
        profile: request.profile,
        focusArea: request.focusArea || 'general',
        promptLength: prompt.length,
      });

      const { object } = await generateObject({
        model: getModel(modelId),
        prompt,
        schema: ReferenceGenerationSchema,
        maxOutputTokens: 4096,
      });

      const referenceGraph = sanitizeReferenceGraph(object.referenceGraph);
      if (referenceGraph.nodes.length === 0) {
        throw new Error('LLM returned an empty reference graph.');
      }

      logLLMResponse('benchmark', {
        success: true,
        mode,
        nodes: referenceGraph.nodes.length,
        edges: referenceGraph.edges.length,
      }, startTime);

      return new Response(
        JSON.stringify({
          profile: request.profile,
          summary: object.summary,
          referenceGraph,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // compare mode
    const referenceGraphRaw = body.referenceGraph;
    if (!referenceGraphRaw) {
      return new Response(
        JSON.stringify({ error: 'referenceGraph is required for compare mode.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const referenceGraph = sanitizeReferenceGraph(referenceGraphRaw);
    const validReferenceNodeIds = new Set(referenceGraph.nodes.map((n) => n.id));
    const userTopology = getUserTopology(request);
    const referenceTopology = getReferenceTopology(referenceGraph);
    const prompt = buildComparePrompt(request, referenceGraph);

    const { startTime } = logLLMRequest('benchmark', {
      mode,
      modelId,
      profile: request.profile,
      focusArea: request.focusArea || 'general',
      promptLength: prompt.length,
      referenceNodes: referenceGraph.nodes.length,
      referenceEdges: referenceGraph.edges.length,
    });

    const { object } = await generateObject({
      model: getModel(modelId),
      prompt,
      schema: CompareSchema,
      maxOutputTokens: 8192,
    });

    const insights = object.insights
      .map((insight) => ({
        ...insight,
        referenceNodeIds: insight.referenceNodeIds.filter((id) => validReferenceNodeIds.has(id)),
      }))
      .filter((insight) => insight.referenceNodeIds.length > 0)
      .slice(0, 24);

    const scenarioByName = new Map(
      object.scenarioMetrics.map((metric) => [metric.scenario, metric] as const)
    );

    const scenarioMetrics = REQUIRED_SCENARIOS.map((scenario) => {
      const metric = scenarioByName.get(scenario);
      if (!metric) {
        return {
          scenario,
          user: { p95Ms: 0, errorRatePct: 0, recoveryMin: 0, opsBurden: 0 },
          reference: { p95Ms: 0, errorRatePct: 0, recoveryMin: 0, opsBurden: 0 },
        };
      }
      return {
        ...metric,
        user: {
          p95Ms: ensureNonNegative(metric.user.p95Ms),
          errorRatePct: ensureNonNegative(metric.user.errorRatePct),
          recoveryMin: ensureNonNegative(metric.user.recoveryMin),
          opsBurden: ensureNonNegative(metric.user.opsBurden),
        },
        reference: {
          p95Ms: ensureNonNegative(metric.reference.p95Ms),
          errorRatePct: ensureNonNegative(metric.reference.errorRatePct),
          recoveryMin: ensureNonNegative(metric.reference.recoveryMin),
          opsBurden: ensureNonNegative(metric.reference.opsBurden),
        },
      };
    });

    const decisions = object.decisions.slice(0, 5).map((decision) => {
      const safeUpgradePath = decision.upgradePath
        .map((step) => step.trim())
        .filter(Boolean)
        .slice(0, 4);
      return {
        ...decision,
        upgradePath: safeUpgradePath.length > 0
          ? safeUpgradePath
          : ['Define one concrete mitigation step.', 'Validate impact with a benchmark rerun.'],
      };
    });

    const result = {
      analysisSource: 'llm' as const,
      profile: request.profile,
      scores: {
        functional: clampScore(object.scores.functional),
        scalability: clampScore(object.scores.scalability),
        reliability: clampScore(object.scores.reliability),
        operability: clampScore(object.scores.operability),
        costEfficiency: clampScore(object.scores.costEfficiency),
        complexityRisk: clampScore(object.scores.complexityRisk),
      },
      topGaps: object.topGaps.slice(0, 3),
      deltas: object.deltas.slice(0, 8),
      scenarioMetrics,
      decisions,
      userTopology,
      referenceTopology,
      referenceGraph,
      insights,
    };

    logLLMResponse('benchmark', {
      success: true,
      mode,
      topGaps: result.topGaps.length,
      deltas: result.deltas.length,
      decisions: result.decisions.length,
      insights: result.insights.length,
    }, startTime);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process benchmark request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
