import { CloudNode, DiagramEdge, DiagramNotes } from './diagram';

export type BenchmarkProfile = 'mvp' | 'growth' | 'hyper_scale' | 'regulated';
export type FocusArea = 'latency' | 'reliability' | 'operability' | 'cost';

export interface BenchmarkRequest {
  diagram: { nodes: CloudNode[]; edges: DiagramEdge[] };
  notes: DiagramNotes;
  profile: BenchmarkProfile;
  focusArea?: FocusArea;
}

export interface ReferenceGenerationResponse {
  profile: BenchmarkProfile;
  referenceGraph: ReferenceGraph;
  summary?: string;
}

export interface ScoreBreakdown {
  functional: number;
  scalability: number;
  reliability: number;
  operability: number;
  costEfficiency: number;
  complexityRisk: number;
}

export interface PriorityGap {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface ArchitectureDelta {
  type: 'missing' | 'overbuilt' | 'risky_coupling' | 'spof';
  component: string;
  detail: string;
}

export interface ScenarioMetricEntry {
  p95Ms: number;
  errorRatePct: number;
  recoveryMin: number;
  opsBurden: number;
}

export interface ScenarioMetric {
  scenario: 'normal' | 'spike_10x' | 'service_failure' | 'queue_backlog' | 'region_degradation';
  user: ScenarioMetricEntry;
  reference: ScenarioMetricEntry;
}

export interface DecisionCard {
  id: string;
  yourDecision: string;
  whereItWorks: string;
  failureMode: string;
  whyReferenceDiffers: string;
  upgradePath: string[];
}

export interface BenchmarkTopologySummary {
  byType: Record<string, number>;
  nodeCount: number;
  edgeCount: number;
}

export type InsightFacet = 'scale' | 'operational' | 'reliability' | 'cost' | 'complexity';
export type InsightStatus = 'missing' | 'partial' | 'aligned';

export interface ReferenceNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  facets: Partial<Record<InsightFacet, string>>;
}

export interface ReferenceEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ReferenceGraph {
  nodes: ReferenceNode[];
  edges: ReferenceEdge[];
}

export interface BenchmarkInsight {
  id: string;
  title: string;
  facet: InsightFacet;
  status: InsightStatus;
  summary: string;
  detail: string;
  referenceNodeIds: string[];
}

export interface BenchmarkResponse {
  analysisSource?: 'llm';
  analysisWarnings?: string[];
  profile: BenchmarkProfile;
  scores: ScoreBreakdown;
  topGaps: PriorityGap[];
  deltas: ArchitectureDelta[];
  scenarioMetrics: ScenarioMetric[];
  decisions: DecisionCard[];
  userTopology: BenchmarkTopologySummary;
  referenceTopology: BenchmarkTopologySummary;
  referenceGraph: ReferenceGraph;
  insights: BenchmarkInsight[];
}
