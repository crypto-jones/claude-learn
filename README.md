# Claude Learn

**An AI-native learning platform for mastering Claude.** Adaptive assessment, personalized curriculum, real-time exercise feedback, and an AI learning companion — all powered by Claude.

**[Try it live](https://claude-learn-phi.vercel.app)**

---

## What It Does

Claude Learn rethinks how people learn to work with AI. Instead of static tutorials or passive video content, every interaction is powered by Claude itself — from evaluating what you already know to giving feedback on your work in real time.

The platform takes learners from their first encounter with Claude through production-level patterns like tool use, evaluator-optimizer loops, and systematic evaluation design.

### The Learning Flow

1. **Conversational Assessment** — Claude conducts a natural conversation to understand your role, experience, and current skill level across five dimensions. No multiple choice — Claude infers your competencies from how you talk about AI.

2. **Personalized Learning Path** — Based on assessment results, the platform generates a recommended sequence of modules tailored to your skill gaps. A developer building with the API gets a different path than a product manager evaluating AI features.

3. **Interactive Modules** — Each module combines concept explanations with hands-on exercises. You write real prompts, design real tool schemas, and build real patterns — then Claude evaluates your work against specific rubrics and gives actionable feedback.

4. **AI Learning Companion** — A context-aware sidebar assistant that knows which module you're in, which section you're reading, and your skill profile. It answers questions, offers encouragement, and helps you connect concepts.

5. **Progress Dashboard** — A skills radar chart tracks growth across all dimensions. The dashboard also includes before/after skill comparison, learning goals, spaced repetition reviews, and session time tracking.

---

## Curriculum

Eight modules across five learning tracks, progressing from fundamentals to advanced production patterns.

### Claude Fundamentals
| Module | Description | Difficulty |
|--------|-------------|------------|
| How Claude Thinks | Mental models for Claude's architecture, strengths, and limitations | Beginner |
| Prompt Engineering Essentials | System prompts, few-shot examples, chain-of-thought reasoning | Beginner |

### Building with the Claude API
| Module | Description | Difficulty |
|--------|-------------|------------|
| Your First API Call | Messages API — authentication, request anatomy, response handling | Beginner |
| Structured Output | Reliably extracting JSON and structured data from Claude | Intermediate |

### Tool Use & Agents
| Module | Description | Difficulty |
|--------|-------------|------------|
| Introduction to Tool Use | Function calling, tool schemas, and the tool use loop | Intermediate |
| Evaluator-Optimizer Loops | Building loops where Claude evaluates and improves its own outputs | Intermediate |

### Claude Code & Developer Workflows
| Module | Description | Difficulty |
|--------|-------------|------------|
| Getting Started with Claude Code | Anthropic's agentic CLI for planning, writing, and debugging code | Intermediate |

### Production AI
| Module | Description | Difficulty |
|--------|-------------|------------|
| Building Systematic Evaluations | Designing rigorous evaluation suites for production AI systems | Advanced |

---

## Skill Dimensions

The platform tracks learner growth across five competency areas:

- **Prompt Engineering** — Crafting effective prompts and system prompts
- **API Integration** — Building with the Messages API and handling structured outputs
- **Agent Design** — Tool use, agentic workflows, and Claude Code
- **Evaluation & Testing** — Evaluator-optimizer patterns and systematic evals
- **Production Deployment** — Shipping reliable, production-grade AI systems

Each dimension is assessed at three levels: *Foundations*, *Practitioner*, and *Advanced*.

---

## Architecture

```
claude-learn/
├── app/
│   ├── api/chat/route.ts            # API endpoint (assessment, feedback, companion modes)
│   ├── assess/page.tsx              # Multi-step assessment flow
│   ├── path/page.tsx                # Personalized learning path
│   ├── learn/[moduleId]/page.tsx    # Module viewer with exercises
│   ├── dashboard/page.tsx           # Skills radar + progress tracking
│   └── layout.tsx                   # Root layout with providers
├── components/
│   ├── learning/CompanionPanel.tsx  # AI learning companion sidebar
│   ├── dashboard/SkillsRadar.tsx    # Recharts radar visualization
│   └── ErrorBoundary.tsx            # Graceful error handling
├── contexts/
│   └── LearnerContext.tsx           # Global state + localStorage persistence
├── content/
│   └── modules/                     # 8 module definitions (JSON)
└── lib/
    ├── types.ts                     # Domain type definitions
    ├── claude.ts                    # Anthropic SDK integration
    └── progress.ts                  # Profile serialization + session tracking
```

### Key Design Decisions

- **Single API route** — One endpoint at `/api/chat` handles all three Claude interaction modes (assessment, exercise feedback, learning companion) with mode-specific system prompts and context injection.

- **Server-side only API key** — The Anthropic API key never reaches the client. All Claude interactions are proxied through a Next.js API route with in-memory rate limiting (20 requests/min per IP).

- **Client-side state** — Learner profiles persist in localStorage with no backend database. The context provider auto-saves on a 60-second interval and on page unload, with profile migration for schema evolution.

- **Content as data** — All module content lives in JSON files with a consistent schema (sections, exercises, evaluation criteria, learning objectives). This makes the curriculum easy to extend, version, and eventually source from a CMS.

- **Section-aware companion** — The learning companion uses `IntersectionObserver` to track which module section the learner is currently reading, passing that context to Claude for more relevant responses.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| AI | [Anthropic SDK](https://docs.anthropic.com/en/api/client-sdks) with streaming |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
git clone https://github.com/crypto-jones/claude-learn.git
cd claude-learn
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

MIT
