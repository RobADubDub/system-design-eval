# System Design Eval

An interactive tool for practicing system design interviews. Build architecture diagrams, take structured notes, and get AI-powered feedback on your designs.

## Features

- **Interactive Diagram Canvas** - Drag-and-drop cloud architecture components (databases, services, load balancers, queues, CDNs, etc.) with inline specifications and connection handles
- **Structured Notes Panel** - Organized sections following the system design interview flow: Problem, Functional Reqs, Workflows, Non-Functional Reqs, Entities, APIs, and Deep Dives
- **AI Design Assistant** - Ask questions about your architecture and get structured tabular insights, with quick actions for bottleneck analysis, security review, redundancy checks, and technology recommendations
- **Technology Recommendations** - Select a component and ask "What technology?" to get specific technology suggestions (e.g., PostgreSQL vs DynamoDB) with trade-off analysis
- **Benchmark Reference Architectures** - Compare your design against AI-generated reference architectures across profiles (MVP, Growth, Hyper-scale, Regulated) with scored insights across scale, reliability, cost, and complexity facets
- **Flow Simulator** - Visualize request flows through your system with AI-generated step-by-step animations and playback controls
- **AI Notes Assistant** - Section-aware AI assistance that stays scoped to the current section (e.g., functional vs non-functional requirements), with progressive hints and validation
- **Problem Templates** - Pre-built problem statements for common system design interview questions (YouTube, Twitter, Uber, etc.)
- **Node Specifications** - Attach inline bullet-point annotations to any component directly on the canvas
- **Undo/Redo** - Full history support for diagram and specification changes
- **Model Selection** - Choose between Claude Haiku 4.5, Sonnet 4.5, or Opus 4.6
- **Save/Load Diagrams** - Persist your work as JSON files with file picker or drag-and-drop

## Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key

### Environment Variables

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

You can get an API key from [console.anthropic.com](https://console.anthropic.com/).

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Define the Problem** - Start by writing a problem statement in the Notes panel, or select a template (YouTube, Uber, Slack, etc.)
2. **Build Your Diagram** - Drag components from the palette onto the canvas and connect them
3. **Take Notes** - Fill in the structured sections: functional reqs, workflows, non-functional reqs, entities, APIs, and deep dives
4. **Get Feedback** - Use the AI Assistant to analyze your design, get technology recommendations, or get section-specific hints on your notes
5. **Benchmark** - Compare your design against a reference architecture for your chosen scale profile and review scored insights
6. **Simulate Flows** - Test your architecture by simulating user scenarios step-by-step

## Tech Stack

- Next.js 16
- React Flow for the diagram canvas
- Vercel AI SDK with Anthropic
- Tailwind CSS

## License

MIT
