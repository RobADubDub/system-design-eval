# Benchmark Against Reference Architectures - UI Spec

## Purpose
Help learners compare their current design against context-appropriate reference architectures and understand tradeoffs in:
- Functional coverage
- Scale and reliability
- Operational readiness
- Cost and complexity

This feature must remain optional and non-disruptive to the existing interview-style flow.

## UX Principles (Non-Pollution Constraints)
1. Progressive disclosure only.
- No always-visible benchmark dashboard.
- No new permanent pane in default layout.
2. Reuse existing interaction surfaces.
- Launch from existing header actions only.
- Render inside existing right panel shell.
3. Preserve user ownership.
- Never auto-rewrite user diagram.
- Present "diff + rationale + upgrade path", not "correct vs wrong".
4. Keep cognitive load low.
- Show top 3 gaps by default.
- Gate advanced comparisons behind expand/click.

## Information Architecture
### Entry Points
1. Header button in existing tool cluster: `Benchmark`.
2. Post-AI prompt suggestion: "Benchmark this design".

### Surface
Use existing right panel pattern from `AI Assistant` and `Flow Simulator`.
- New right-panel mode: `benchmark`.
- Same resize and close behavior.
- No change to center canvas layout model.
- No Notes panel CTA or additional per-section button for benchmark launch.

## User Flow
1. User clicks `Benchmark`.
2. App opens right panel with setup card:
- Problem context confirmation (from `Problem` notes).
- Reference profile picker: `MVP`, `Growth`, `Hyper-scale`, `Regulated`.
- Optional focus area: `Latency`, `Reliability`, `Operability`, `Cost`.
3. User runs benchmark.
4. App shows three-layer results:
- Layer 1 summary: score cards and top gaps.
- Layer 2 visual diff: user vs reference topology deltas.
- Layer 3 decision cards: rationale and improvement paths.
5. User can click `Create Improvement Checklist` to push concise action items into `Deep Dives`.

## Panel Layout Spec
## Header Row
- Title: `Reference Benchmark`
- Subtext: `<profile> profile`
- Actions:
- `Re-run`
- `Change profile`
- `Close`

## Section A - Snapshot (always visible)
- Compact score strip (0-100):
- Functional coverage
- Scalability
- Reliability
- Operability
- Cost efficiency
- Complexity risk
- "Top 3 priorities" list with severity chips (`High`, `Med`, `Low`).

## Section B - Architecture Diff (collapsed by default)
- Toggle: `Show architecture differences`.
- Compact side-by-side mini views:
- `Your design`
- `Reference pattern`
- Delta list with tags:
- `Missing`
- `Overbuilt`
- `Risky coupling`
- `SPOF`
- Secondary action: `Open Full Compare`.
- `Open Full Compare` launches a temporary full-canvas compare workspace (not the RHS panel) for detailed visual diffing.
- Closing full compare returns user to the normal canvas + benchmark panel state.

## Section C - Scenario Replay (collapsed by default)
- Toggle: `Compare behavior under scenarios`.
- Scenario tabs:
- Normal load
- 10x spike
- Single service failure
- Queue backlog
- Region degradation
- For each scenario show side-by-side table:
- p95 latency
- Error rate
- Recovery time
- Ops burden (alerts/page pressure)

## Section D - Decision Cards (always visible)
Each card format:
- `Your decision`
- `Where it works`
- `Failure mode`
- `Why reference differs`
- `Practical upgrade path` (ordered steps)

## Section E - Apply to Notes
- Button: `Send priorities to Deep Dives`
- Button: `Send ops risks to Non-Functional Reqs`

## Visual Language
- Follow existing Tailwind tokens and neutral palette.
- Reuse existing small button/text scale from AI and Flow panels.
- In RHS panel, avoid full-bleed charts; use compact inline spark/radar visuals.
- Full-canvas compare can use expanded visual diff affordances because it is explicitly opt-in.
- Animations: only expand/collapse and lightweight number transitions.

## Interaction Details
### Empty/Blocked States
- If no problem statement: show inline blocker with CTA to `Problem` section.
- If too few nodes (<3): show "insufficient architecture detail" helper.

### Latency Expectations
- Initial benchmark target: <4s.
- If >1.5s, show skeleton rows in Snapshot and stream partial findings.

### Keyboard
- `Esc`: close panel (existing behavior).
- `Enter`: run benchmark from setup form.
- Arrow keys: navigate scenario tabs.
- In full compare mode, `Esc` exits compare and restores prior panel state.

## Data Contract (UI-facing)
```ts
type BenchmarkProfile = 'mvp' | 'growth' | 'hyper_scale' | 'regulated';
type FocusArea = 'latency' | 'reliability' | 'operability' | 'cost';

interface BenchmarkRequest {
  diagram: { nodes: CloudNode[]; edges: DiagramEdge[] };
  notes: DiagramNotes;
  profile: BenchmarkProfile;
  focusArea?: FocusArea;
}

interface ScoreBreakdown {
  functional: number;
  scalability: number;
  reliability: number;
  operability: number;
  costEfficiency: number;
  complexityRisk: number;
}

interface PriorityGap {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  rationale: string;
}

interface ArchitectureDelta {
  type: 'missing' | 'overbuilt' | 'risky_coupling' | 'spof';
  component: string;
  detail: string;
}

interface ScenarioMetric {
  scenario: 'normal' | 'spike_10x' | 'service_failure' | 'queue_backlog' | 'region_degradation';
  user: { p95Ms: number; errorRatePct: number; recoveryMin: number; opsBurden: number };
  reference: { p95Ms: number; errorRatePct: number; recoveryMin: number; opsBurden: number };
}

interface DecisionCard {
  id: string;
  yourDecision: string;
  whereItWorks: string;
  failureMode: string;
  whyReferenceDiffers: string;
  upgradePath: string[];
}

interface BenchmarkResponse {
  profile: BenchmarkProfile;
  scores: ScoreBreakdown;
  topGaps: PriorityGap[];
  deltas: ArchitectureDelta[];
  scenarioMetrics: ScenarioMetric[];
  decisions: DecisionCard[];
}
```

## Scoring Model (V1)
Use weighted rubric per profile to avoid one-size-fits-all grading.

Example weights:
- `mvp`: functional 30, complexity 25, cost 20, reliability 15, operability 10
- `growth`: scalability 25, reliability 25, operability 20, cost 15, functional 15
- `hyper_scale`: reliability 30, operability 25, scalability 25, cost 10, complexity 10
- `regulated`: reliability 25, operability 25, functional 15, complexity 15, cost 10, scalability 10

## Backend API
- New route: `POST /api/ai/benchmark`
- Request/response shapes as above
- Streaming optional in V1.1; V1 can return full JSON once complete

## Persistence
Extend saved diagram model with optional benchmark history:
```ts
interface BenchmarkRun {
  runId: string;
  createdAt: string;
  profile: BenchmarkProfile;
  response: BenchmarkResponse;
}
```

Storage rules:
- Keep last 5 runs per diagram.
- Do not auto-open past run on diagram load.
- User opens history from inside benchmark panel only.

## Telemetry
Track:
- benchmark_opened
- benchmark_run_started
- benchmark_run_completed
- benchmark_apply_to_notes_clicked
- benchmark_profile_selected

Success indicators:
- % of users who run benchmark after finishing notes
- % who apply checklist to notes
- second-run rate within same session

## Rollout Plan
1. V1
- Setup + Snapshot + Top 3 gaps + Decision cards + Apply to Notes.
2. V1.1
- Architecture diff mini view in RHS + `Open Full Compare`.
3. V1.2
- Scenario replay and profile-tuned weighting refinements.

## Acceptance Criteria
1. Feature is never shown by default on initial page load.
2. Enabling benchmark does not modify existing diagram unless user clicks explicit apply actions.
3. User can close benchmark and continue without losing current canvas/notes context.
4. Benchmark results are understandable in under 30 seconds from first render.
5. Operability appears as a first-class scored dimension in UI and response data.
