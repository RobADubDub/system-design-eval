# System Design Eval

An interactive tool for practicing system design interviews. Build architecture diagrams, take structured notes, and get AI-powered feedback on your designs.

## Features

- **Interactive Diagram Canvas** - Drag-and-drop cloud architecture components (databases, services, load balancers, queues, CDNs, etc.)
- **Structured Notes Panel** - Organized sections for requirements, API design, data model, scaling considerations, and more
- **AI Design Assistant** - Ask questions about your architecture and get structured insights
- **Flow Simulator** - Visualize request flows through your system with AI-generated step-by-step animations
- **AI Hints & Validation** - Get progressive hints and validate your notes against best practices
- **Model Selection** - Choose between Claude Haiku 4.5, Sonnet 4.5, or Opus 4.5
- **Save/Load Diagrams** - Persist your work as JSON files

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

1. **Define the Problem** - Start by writing a problem statement in the Notes panel (or use a template)
2. **Build Your Diagram** - Drag components from the palette onto the canvas and connect them
3. **Take Notes** - Fill in the structured sections: requirements, API design, data model, etc.
4. **Get Feedback** - Use the AI Assistant to analyze your design or get hints on specific sections
5. **Simulate Flows** - Test your architecture by simulating user scenarios

## Tech Stack

- Next.js 16
- React Flow for the diagram canvas
- Vercel AI SDK with Anthropic
- Tailwind CSS

## License

MIT
