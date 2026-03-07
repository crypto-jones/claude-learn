# Claude Learn

**An AI-native learning platform for mastering Claude.** Adaptive assessment, personalized curriculum, real-time exercise feedback, and an AI learning companion — all powered by Claude.

Built as a portfolio project for Anthropic's Sr. Education Platform Engineer role.

**[Try it live](https://claude-learn-phi.vercel.app)**

---

## What It Does

Claude Learn rethinks how people learn to work with AI. Instead of static tutorials or passive video content, every interaction is powered by Claude itself — from evaluating what you already know to giving feedback on your work in real time.

The platform serves multiple audiences — developers building with the API, product managers evaluating AI use cases, designers prototyping AI experiences, and business professionals integrating AI into their workflows. Content and examples adapt based on your role and skill level.

### The Learning Flow

1. **Conversational Assessment** — Claude conducts a natural conversation to understand your role, experience, and current skill level across six dimensions. No multiple choice — Claude infers your competencies from how you talk about AI.

2. **Personalized Learning Path** — Based on assessment results, the platform generates a recommended sequence of modules tailored to your skill gaps. A developer building with the API gets a different path than a product manager evaluating AI features.

3. **Interactive Modules** — Each module combines concept explanations with hands-on exercises. You write real prompts, design real tool schemas, and build real patterns — then Claude evaluates your work against specific rubrics and gives streaming, actionable feedback.

4. **AI Learning Companion** — A context-aware sidebar assistant that knows which module you're in, which section you're reading, and your skill profile. It answers questions, offers encouragement, and helps you connect concepts across the curriculum.

5. **Progress Dashboard** — A skills radar chart tracks growth across all dimensions with animated before/after comparison. Set learning goals, track streaks, and export a shareable skills card as a PNG.

---

## Key Features

### AI-Powered

- **Conversational skill assessment** — Claude evaluates your competency through natural dialogue, not quizzes
- **Streaming exercise feedback** — Submit exercises and get real-time, rubric-based feedback with improvement suggestions
- **Context-aware companion** — IntersectionObserver tracks which section you're reading so the companion gives relevant answers
- **Role-adaptive content** — Examples and explanations adjust based on whether you're a developer, PM, designer, or business user
- **Live prompt playground** — Test prompts against the Claude API directly within module pages, with streaming responses

### Learning Experience

- **Prerequisite soft-gates** — Modules suggest (but don't require) prerequisite completion, with direct links to recommended modules
- **Concept connections** — Key terms link across modules, building a knowledge graph as you learn
- **Module completion celebration** — Confetti animation and skill-level-up reveal when you finish a module
- **Spaced repetition reviews** — Dashboard surfaces modules for review based on when you completed them
- **Learning goals** — Set target skill levels and track progress toward them

### Visual Polish

- **Syntax-highlighted code blocks** — prism-react-renderer with language badges, one-click copy, and light/dark theme support
- **Animated skills radar** — Recharts radar with growth overlay showing initial vs. current skill levels
- **Shareable skills card** — Export a hand-drawn SVG radar card as a PNG image for sharing progress
- **Skeleton loading states** — Content-aware placeholder UI on every page during data hydration
- **Smooth page transitions** — Fade/slide animations between routes
- **Dark mode** — Full dark theme with system preference detection and manual toggle

### Robustness

- **Per-route error boundaries** — Errors in one page don't break navigation; each route recovers independently
- **Graceful degradation** — Optional chaining throughout profile access prevents crashes with incomplete state
- **Rate limiting** — Server-side request throttling (20 req/min per IP) protects the API key
- **Session persistence** — Auto-saves to localStorage every 60 seconds and on page unload via ref-based handler

---

## Curriculum

Five implemented modules with real educational content. Module definitions are JSON, making the curriculum easy to extend.

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

---

## Skill Dimensions

The platform tracks learner growth across six competency areas:

- **Prompt Engineering** — Crafting effective prompts and system prompts
- **Mental Models** — Understanding how Claude thinks and reasons
- **API Integration** — Building with the Messages API and handling structured outputs
- **Output Design** — Designing reliable, structured AI outputs
- **Evaluation** — Evaluator-optimizer patterns and systematic evals
- **Agent Design** — Tool use, agentic workflows, and Claude Code

Each dimension is assessed at three levels: *Foundations*, *Developing*, *Practitioner*, and *Advanced*.

---

## Architecture

```
claude-learn/
├── app/
│   ├── api/chat/route.ts              # Single API endpoint (3 modes: assessment, feedback, companion)
│   ├── assess/page.tsx                # Multi-step assessment (role → experience → conversation → skills reveal)
│   ├── path/page.tsx                  # Personalized learning path with module recommendations
│   ├── learn/[moduleId]/page.tsx      # Module viewer with exercises, code blocks, companion
│   ├── learn/[moduleId]/error.tsx     # Per-route error boundary
│   ├── dashboard/page.tsx             # Skills radar, progress tracking, goals, sharing
│   ├── dashboard/error.tsx            # Per-route error boundary
│   └── layout.tsx                     # Root layout with providers, error boundary, page transitions
├── components/
│   ├── learning/
│   │   ├── CompanionPanel.tsx         # AI learning companion sidebar
│   │   ├── CodeBlock.tsx              # Syntax-highlighted code with copy button
│   │   ├── AdaptedContent.tsx         # Role-adaptive content sections
│   │   └── PromptPlayground.tsx       # Live prompt testing against Claude API
│   ├── dashboard/
│   │   ├── SkillsRadar.tsx            # Recharts radar with growth overlay
│   │   ├── ShareableSkillsCard.tsx    # Hand-drawn SVG radar for image export
│   │   └── ShareDialog.tsx            # PNG export dialog with html-to-image
│   ├── ui/                            # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── Navigation.tsx                 # App navigation with auth-aware links
│   ├── PageTransition.tsx             # Route transition animations
│   ├── ThemeToggle.tsx                # Dark/light mode toggle
│   └── ErrorBoundary.tsx              # Global error boundary
├── contexts/
│   └── LearnerContext.tsx             # Global state + localStorage persistence + ref-based unload
├── content/
│   └── modules/                       # 5 module definitions (JSON)
└── lib/
    ├── types.ts                       # Domain type definitions (profiles, skills, modules)
    ├── claude.ts                      # Anthropic SDK integration with streaming
    ├── modules.ts                     # Module registry and utilities
    ├── concepts.ts                    # Cross-module concept linking
    └── progress.ts                    # Profile serialization, session tracking, streak management
```

### Key Design Decisions

- **Single API route** — One endpoint at `/api/chat` handles all three Claude interaction modes (assessment, exercise feedback, learning companion) with mode-specific system prompts and context injection. This keeps the API surface minimal and the prompt engineering centralized.

- **Server-side only API key** — The Anthropic API key never reaches the client. All Claude interactions are proxied through a Next.js API route with in-memory rate limiting.

- **Client-side state** — Learner profiles persist in localStorage with no backend database. The context provider auto-saves on a 60-second interval and on page unload using a ref-based handler to avoid stale closure issues.

- **Content as data** — All module content lives in JSON files with a consistent schema (sections, exercises, evaluation criteria, learning objectives, prerequisites). This makes the curriculum easy to extend, version, and eventually source from a CMS.

- **Section-aware companion** — The learning companion uses `IntersectionObserver` to track which module section the learner is currently reading, passing that context to Claude for more relevant responses.

- **Hand-drawn SVG for export** — The shareable skills card uses raw SVG polygons instead of Recharts because chart libraries don't export reliably with html-to-image. Colors are hardcoded oklch values rather than CSS variables for the same reason.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| AI | [Anthropic SDK](https://docs.anthropic.com/en/api/client-sdks) with streaming |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (oklch color space) |
| Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Charts | [Recharts](https://recharts.org) (radar visualization) |
| Code Highlighting | [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer) |
| Image Export | [html-to-image](https://github.com/bubkoo/html-to-image) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
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
