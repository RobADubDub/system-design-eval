'use client';

import { useMemo, useState } from 'react';
import { useSettings } from '@/components/settings/SettingsContext';
import {
  BenchmarkInsight,
  BenchmarkProfile,
  BenchmarkResponse,
  FocusArea,
  ReferenceGenerationResponse,
  ReferenceGraph,
} from '@/types/benchmark';
import { CloudNode, DiagramEdge, DiagramNotes } from '@/types/diagram';

interface BenchmarkPanelProps {
  nodes: CloudNode[];
  edges: DiagramEdge[];
  notes: DiagramNotes;
  onClose: () => void;
  onOpenFullCompare: (payload: {
    profile: BenchmarkProfile;
    referenceGraph: ReferenceGraph;
    insights: BenchmarkInsight[];
  }) => void;
  onAppendToSection: (sectionId: string, content: string) => void;
}

const PROFILE_OPTIONS: Array<{ value: BenchmarkProfile; label: string }> = [
  { value: 'mvp', label: 'MVP' },
  { value: 'growth', label: 'Growth' },
  { value: 'hyper_scale', label: 'Hyper-scale' },
  { value: 'regulated', label: 'Regulated' },
];

const FOCUS_OPTIONS: Array<{ value: FocusArea; label: string }> = [
  { value: 'latency', label: 'Latency' },
  { value: 'reliability', label: 'Reliability' },
  { value: 'operability', label: 'Operability' },
  { value: 'cost', label: 'Cost' },
];

const SCENARIO_LABELS: Record<string, string> = {
  normal: 'Normal load',
  spike_10x: '10x spike',
  service_failure: 'Service failure',
  queue_backlog: 'Queue backlog',
  region_degradation: 'Region degradation',
};

export function BenchmarkPanel({
  nodes,
  edges,
  notes,
  onClose,
  onOpenFullCompare,
  onAppendToSection,
}: BenchmarkPanelProps) {
  const { settings } = useSettings();
  const [profile, setProfile] = useState<BenchmarkProfile>('growth');
  const [focusArea, setFocusArea] = useState<FocusArea | ''>('');

  const [isGeneratingReference, setIsGeneratingReference] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [referenceData, setReferenceData] = useState<ReferenceGenerationResponse | null>(null);
  const [result, setResult] = useState<BenchmarkResponse | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const problemStatement = useMemo(
    () => notes.sections.find((s) => s.id === 'problem')?.content?.trim() || '',
    [notes.sections]
  );

  const canGenerateReference = problemStatement.length > 0;
  const canRunComparison = canGenerateReference && nodes.length >= 3;
  const needsMoreNodesForComparison = nodes.length < 3;
  const hasReference = !!referenceData?.referenceGraph?.nodes?.length;
  const comparePayload = useMemo(
    () => ({
      profile,
      referenceGraph: result?.referenceGraph || referenceData?.referenceGraph,
      insights: result?.insights || [],
    }),
    [profile, referenceData?.referenceGraph, result?.referenceGraph, result?.insights]
  );

  const resetComparisonState = () => {
    setResult(null);
    setShowDiff(false);
    setShowScenarios(false);
  };

  const executeBenchmarkCall = async (mode: 'reference' | 'compare', referenceGraph?: ReferenceGraph) => {
    const response = await fetch('/api/ai/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        diagram: { nodes, edges },
        notes,
        profile,
        focusArea: focusArea || undefined,
        model: settings.selectedModel,
        referenceGraph,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Benchmark ${mode} call failed.`);
    }

    return response.json();
  };

  const generateReferenceDesign = async () => {
    if (!canGenerateReference || isGeneratingReference) return;
    setIsGeneratingReference(true);
    setRunError(null);
    try {
      const generated = (await executeBenchmarkCall('reference')) as ReferenceGenerationResponse;
      setReferenceData(generated);
      resetComparisonState();
    } catch (error) {
      setReferenceData(null);
      setResult(null);
      setRunError((error as Error).message || 'Reference generation failed.');
    } finally {
      setIsGeneratingReference(false);
    }
  };

  const runComparison = async () => {
    if (!canRunComparison || !referenceData || isComparing) return;
    setIsComparing(true);
    setRunError(null);
    try {
      const comparison = (await executeBenchmarkCall('compare', referenceData.referenceGraph)) as BenchmarkResponse;
      setResult(comparison);
    } catch (error) {
      setResult(null);
      setRunError((error as Error).message || 'Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  const scoreEntries = result
    ? [
        { key: 'Functional', value: result.scores.functional },
        { key: 'Scalability', value: result.scores.scalability },
        { key: 'Reliability', value: result.scores.reliability },
        { key: 'Operability', value: result.scores.operability },
        { key: 'Cost', value: result.scores.costEfficiency },
        { key: 'Complexity', value: result.scores.complexityRisk },
      ]
    : [];

  const appendPrioritiesToDeepDives = () => {
    if (!result) return;
    const lines = result.topGaps
      .map((gap, idx) => `${idx + 1}. ${gap.title} (${gap.severity}) - ${gap.rationale}`)
      .join('\n');
    onAppendToSection('deepdives', `\nBenchmark priorities (${profile}):\n${lines}\n`);
  };

  const appendOpsRisksToNonFunctional = () => {
    if (!result) return;
    const opsLines = result.deltas
      .filter((d) => d.type === 'spof' || d.type === 'risky_coupling')
      .map((d) => `- ${d.component}: ${d.detail}`)
      .join('\n');
    if (opsLines.trim()) {
      onAppendToSection('nonfunctional', `\nOperational risk checklist (${profile}):\n${opsLines}\n`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">Benchmark</span>
          <span className="font-medium text-gray-800 text-sm">Reference</span>
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

      <div className="p-3 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Problem context</p>
        {problemStatement ? (
          <p className="text-xs text-gray-700 line-clamp-3">{problemStatement}</p>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
            Add a Problem statement in Notes before running benchmark.
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-500">
            Profile
            <select
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value as BenchmarkProfile);
                setReferenceData(null);
                resetComparisonState();
              }}
              className="mt-1 w-full border border-gray-200 rounded px-2 py-1.5 text-xs bg-white"
            >
              {PROFILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-gray-500">
            Focus area
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value as FocusArea | '')}
              className="mt-1 w-full border border-gray-200 rounded px-2 py-1.5 text-xs bg-white"
            >
              <option value="">General</option>
              {FOCUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={generateReferenceDesign}
              disabled={!canGenerateReference || isGeneratingReference}
              className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {isGeneratingReference ? 'Generating...' : hasReference ? 'Regenerate reference' : '1) Generate reference design'}
            </button>

            <div className="relative group">
              <button
                onClick={runComparison}
                disabled={!canRunComparison || !hasReference || isComparing}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isComparing ? 'Comparing...' : '2) Run comparison'}
              </button>
              {needsMoreNodesForComparison && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-gray-900 text-white text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20"
                  role="tooltip"
                >
                  Add at least 3 nodes to run comparison.
                </div>
              )}
            </div>
          </div>

          {hasReference && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600">
                Reference ready: {referenceData?.referenceGraph.nodes.length} nodes, {referenceData?.referenceGraph.edges.length} edges.
              </p>
              <button
                onClick={() => {
                  if (!comparePayload.referenceGraph) return;
                  onOpenFullCompare({
                    profile: comparePayload.profile,
                    referenceGraph: comparePayload.referenceGraph,
                    insights: comparePayload.insights,
                  });
                }}
                className="px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                Open compare view
              </button>
            </div>
          )}
        </div>

        {runError && (
          <p className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
            {runError}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {(isGeneratingReference || isComparing) && (
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        )}

        {!result && hasReference && (
          <section className="border border-gray-200 rounded bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-800">
              Reference design generated. Run step 2 to produce differences, scenarios, and decision guidance.
            </p>
          </section>
        )}

        {result && (
          <>
            <section className="border border-gray-200 rounded">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">Snapshot</p>
              </div>
              <div className="p-3 space-y-2">
                {scoreEntries.map((entry) => (
                  <div key={entry.key}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{entry.key}</span>
                      <span className="text-xs font-medium text-gray-800">{entry.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded mt-1">
                      <div className="bg-amber-500 h-1.5 rounded" style={{ width: `${entry.value}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <p className="text-xs font-medium text-gray-700 mb-1">Top 3 priorities</p>
                  <div className="space-y-1">
                    {result.topGaps.map((gap) => (
                      <div key={gap.id} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                        <span className="font-medium">{gap.title}</span> ({gap.severity})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 rounded">
              <button
                onClick={() => setShowDiff((prev) => !prev)}
                className="w-full px-3 py-2 border-b border-gray-100 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-gray-700">Architecture diff</span>
                <span className="text-xs text-gray-500">{showDiff ? 'Hide' : 'Show'}</span>
              </button>
              {showDiff && (
                <div className="p-3 space-y-2">
                  <div className="space-y-1">
                    {result.deltas.length === 0 ? (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1.5">
                        No high-confidence architecture deltas for this profile.
                      </p>
                    ) : (
                      result.deltas.map((delta, index) => (
                        <p key={`${delta.component}-${index}`} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                          <span className="font-medium">{delta.type}</span> - {delta.component}: {delta.detail}
                        </p>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() =>
                      onOpenFullCompare({
                        profile: comparePayload.profile,
                        referenceGraph: comparePayload.referenceGraph!,
                        insights: comparePayload.insights,
                      })
                    }
                    className="px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Open Full Compare
                  </button>
                </div>
              )}
            </section>

            <section className="border border-gray-200 rounded">
              <button
                onClick={() => setShowScenarios((prev) => !prev)}
                className="w-full px-3 py-2 border-b border-gray-100 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-gray-700">Scenario replay</span>
                <span className="text-xs text-gray-500">{showScenarios ? 'Hide' : 'Show'}</span>
              </button>
              {showScenarios && (
                <div className="p-3 space-y-2">
                  {result.scenarioMetrics.map((metric) => (
                    <div key={metric.scenario} className="border border-gray-100 rounded p-2 bg-gray-50">
                      <p className="text-xs font-medium text-gray-700 mb-1">{SCENARIO_LABELS[metric.scenario]}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div>
                          <p className="font-medium text-gray-600">Your design</p>
                          <p>p95: {metric.user.p95Ms}ms</p>
                          <p>Errors: {metric.user.errorRatePct}%</p>
                          <p>Recovery: {metric.user.recoveryMin}m</p>
                          <p>Ops burden: {metric.user.opsBurden}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Reference</p>
                          <p>p95: {metric.reference.p95Ms}ms</p>
                          <p>Errors: {metric.reference.errorRatePct}%</p>
                          <p>Recovery: {metric.reference.recoveryMin}m</p>
                          <p>Ops burden: {metric.reference.opsBurden}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border border-gray-200 rounded">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">Decision cards</p>
              </div>
              <div className="p-3 space-y-2">
                {result.decisions.map((card) => (
                  <article key={card.id} className="border border-gray-100 rounded bg-gray-50 p-2">
                    <p className="text-xs font-medium text-gray-700">{card.yourDecision}</p>
                    <p className="text-xs text-gray-600 mt-1">Where it works: {card.whereItWorks}</p>
                    <p className="text-xs text-gray-600 mt-1">Failure mode: {card.failureMode}</p>
                    <p className="text-xs text-gray-600 mt-1">Why reference differs: {card.whyReferenceDiffers}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="border border-gray-200 rounded">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">Apply to notes</p>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                <button
                  onClick={appendPrioritiesToDeepDives}
                  className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Send priorities to Deep Dives
                </button>
                <button
                  onClick={appendOpsRisksToNonFunctional}
                  className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Send ops risks to Non-Functional Reqs
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
