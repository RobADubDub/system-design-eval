# Future Feature Considerations - System Design Learning Tool

**Status**: Tabled for future implementation

## Current State Summary
The app currently supports: 15 node types, 7 structured note sections, AI validation/hints, AI chat assistant, flow simulation, 21 problem templates, specifications (linked annotations), and full diagram persistence.

---

## User-Prioritized Features

The following features have been identified as priorities for future implementation:

| Feature | Category | Complexity |
|---------|----------|------------|
| **Guided Interview Mode** | Learning & Assessment | High |
| **Auto-Layout & Organization** | Diagram Intelligence | Medium |
| **Capacity/Scale Estimation** | Diagram Intelligence | High |
| **Cost Estimation** | Diagram Intelligence | Medium-High |
| **LLM Provider Options** | Integration | Medium |
| **Dark Mode** | Accessibility & UX | Low |
| **Keyboard-First Navigation** | Accessibility & UX | Medium |

---

## Complete Feature Backlog

### 1. Learning & Assessment

#### A. Scoring/Grading System
- AI evaluates the complete design (diagram + notes) against rubric
- Scores across dimensions: scalability, reliability, maintainability, cost
- Comparison to "reference solutions" for each problem template
- Track improvement over time across practice sessions

#### B. Guided Interview Mode ⭐ PRIORITY
- Timed practice sessions (45 min typical interview length)
- AI plays the role of interviewer, asking follow-up questions
- "Interviewer" probes weak areas: "What happens if this service goes down?"
- Post-interview summary with strengths/weaknesses

#### C. Concept Flashcards/Quizzes
- Quick-fire questions on system design concepts
- "When would you use a message queue vs direct API call?"
- Spaced repetition for retention
- Linked to relevant sections when user struggles

#### D. Progressive Difficulty
- Problem templates tagged by difficulty (beginner, intermediate, advanced)
- Unlock harder problems after demonstrating competency
- Suggested learning paths (e.g., "Master caching before tackling distributed systems")

---

### 2. Diagram Intelligence

#### A. Architecture Patterns Recognition
- AI detects common patterns in user's diagram (CQRS, event sourcing, microservices)
- Suggests: "This looks like an event-driven architecture. Consider adding..."
- Warns about anti-patterns: "Direct database access from client is risky"

#### B. Auto-Layout & Organization ⭐ PRIORITY
- One-click layout optimization
- Group related components visually
- Suggest component placement based on data flow

#### C. Capacity/Scale Estimation ⭐ PRIORITY
- Input expected load (users, requests/sec, data volume)
- AI estimates required resources per component
- Highlights bottlenecks: "At 10K RPS, this single database becomes a bottleneck"

#### D. Cost Estimation ⭐ PRIORITY
- Rough cloud cost estimates based on architecture
- "This design would cost approximately $X/month on AWS"
- Compare cost of different architectural choices

#### E. Diagram Diff/Versioning
- Compare two versions of a design
- "What changed between v1 and v2?"
- Branching: explore alternative approaches without losing original

---

### 3. Collaboration & Sharing

#### A. Shareable Links
- Generate read-only links to share designs
- Embed in portfolios or documentation
- Optional password protection

#### B. Real-time Collaboration
- Multiple users editing same diagram
- Cursor presence (see where others are working)
- Comments/annotations from reviewers

#### C. Export Options
- Export as PNG/SVG for presentations
- Export as PDF with notes included
- Export as Markdown documentation
- Mermaid/PlantUML diagram code generation

---

### 4. Enhanced AI Features

#### A. "Explain This" for Any Component
- Click any node → "Explain what this component does and when to use it"
- Deep-dive explanations with real-world examples
- Links to external resources (documentation, articles)

#### B. Trade-off Analysis
- "Compare SQL vs NoSQL for this use case"
- AI generates pros/cons table specific to user's requirements
- Suggests which option fits better and why

#### C. "What If" Scenarios
- "What if traffic increased 10x?"
- "What if this region went down?"
- AI walks through implications on current design

#### D. Code Snippet Generation
- Generate boilerplate code for components
- API endpoint stubs based on API notes
- Database schema SQL from entity notes
- Infrastructure-as-code (Terraform/CloudFormation) sketches

#### E. Voice/Audio Mode
- Practice explaining designs verbally
- Speech-to-text for adding notes
- AI provides verbal feedback (interview simulation)

---

### 5. Content & Templates

#### A. Solution Library
- Reference solutions for each problem template
- Multiple valid approaches shown
- Explanation of trade-offs in each approach
- Reveal after user attempts their own solution

#### B. Component Deep-Dives
- Detailed pages for each component type
- Real-world examples: "How Netflix uses CDNs"
- Configuration best practices
- Common mistakes to avoid

#### C. Custom Problem Creation
- Users create their own problem templates
- Share with community
- Curated "community picks"

---

### 6. Gamification & Engagement

#### A. Achievements/Badges
- "Completed 10 designs"
- "Used all 15 component types"
- "Received 'Excellent' rating on scalability"
- Progress visualization

#### B. Daily Challenges
- New mini-problem each day
- Leaderboard for fastest/best solutions
- Streak tracking

#### C. Learning Streaks
- Track consecutive days of practice
- Gentle reminders to maintain streak
- Weekly/monthly progress reports

---

### 7. Integration & Extensions

#### A. Import Existing Architectures
- Import from AWS/GCP/Azure diagram formats
- Parse infrastructure-as-code to generate diagram
- Reverse-engineer from API documentation

#### B. LLM Provider Options ⭐ PRIORITY
- Support multiple AI providers (OpenAI, Anthropic, local models)
- User brings their own API key
- Model selection for cost/quality trade-off

#### C. Plugin System
- Custom node types for specific domains
- Custom validation rules
- Integration with external tools (Jira, Confluence, etc.)

---

### 8. Accessibility & UX Improvements

#### A. Dark Mode ⭐ PRIORITY
- System-preference aware
- Reduces eye strain for long sessions

#### B. Mobile/Tablet Support
- Touch-friendly interactions
- Responsive layout for smaller screens
- Practice on-the-go

#### C. Keyboard-First Navigation ⭐ PRIORITY
- Full diagram editing via keyboard
- Vim-like command mode for power users
- Customizable shortcuts

#### D. Undo/Redo Visualization
- Timeline view of changes
- Jump to any point in history
- Branch from historical state

---

## Technical Notes

### LLM Token Usage Tracking

**Status**: Tabled for later

**Goal**: Provide visibility into token usage/cost for LLM interactions.

#### Options Considered

##### Option 1: Client-side word/character counting
- **Pros**: Simple, no backend changes
- **Cons**: Inaccurate (~1.3 tokens per word is a rough estimate), misses system prompts, doesn't account for cached token discounts

##### Option 2: Get actual token usage from the API (Recommended)
The Vercel AI SDK (`streamObject`) provides actual token counts in the `onFinish` callback:
```typescript
{
  promptTokens: number,
  completionTokens: number,
  totalTokens: number
}
```

**Challenge**: With streaming responses, usage info only arrives at the end. Options:
- Append to stream as final metadata chunk
- Return via response header (tricky with streaming)
- Store server-side and fetch separately

##### Option 3: Server-side aggregation
Use existing `logLLMRequest`/`logLLMResponse` to accumulate totals and expose via endpoint.

#### Implementation Considerations
- **Multiple API routes**: `/api/ai/chat`, `/api/ai/analyze`, `/api/ai/notes-assist` all need tracking
- **Session vs. persistent**: Decide whether to track per-session only or persist across sessions
- **Cached tokens**: Anthropic's prompt caching discount isn't typically exposed in usage response

#### Recommendation
Go with **Option 2** - modify API routes to return actual `usage` data at the end of the stream. Most accurate without being overly complex.
