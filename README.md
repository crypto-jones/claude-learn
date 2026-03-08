# Claude Learn

**An AI-native learning platform for mastering Claude.** Adaptive assessment, personalized curriculum, real-time exercise feedback, and an AI learning companion — all powered by Claude.

**[Try it live](https://claude-learn-phi.vercel.app)**

---

## What It Does

Claude Learn rethinks how people learn to work with AI. Instead of static tutorials or passive video content, every interaction is powered by Claude itself — from evaluating what you already know to giving feedback on your work in real time.

The platform serves five audiences — developers building with the API, product managers evaluating AI use cases, designers prototyping AI experiences, business professionals integrating AI into their workflows, and beginners just getting started with AI. Each path has its own skill dimensions, curated curriculum, and tailored assessment.

### The Learning Flow

1. **Conversational Assessment** — Claude conducts a natural conversation to understand your role, experience, and current skill level. The assessment adapts to your role — each path is evaluated across its own five skill dimensions. No multiple choice — Claude infers your competencies from how you talk about AI.

2. **Personalized Learning Path** — Based on assessment results, the platform generates a recommended sequence of modules tailored to your skill gaps. A developer building with the API gets a different path than a product manager evaluating AI features.

3. **Interactive Modules** — Each module combines concept explanations with hands-on exercises. You write real prompts, design real tool schemas, and build real patterns — then Claude evaluates your work against specific rubrics and gives streaming, actionable feedback. After initial feedback, you can continue the conversation: ask follow-up questions, submit revised thinking, and get deeper coaching from Claude in a natural dialogue.

4. **AI Learning Companion** — A context-aware sidebar assistant that knows which module you're in, which section you're reading, and your skill profile. It answers questions, offers encouragement, and helps you connect concepts across the curriculum.

5. **Progress Dashboard** — A skills radar chart tracks growth across your role's relevant dimensions with animated before/after comparison. Set learning goals, track streaks, and export a shareable skills card as a PNG.

---

## Features

- **Iterative exercise conversations** — After structured feedback, exercises become dialogues — ask follow-up questions, revise your answer, and get conversational coaching that pushes you deeper
- **Role-adaptive content** — Examples and explanations adjust based on whether you're a developer, PM, designer, or business user
- **Live prompt playground** — Test prompts against the Claude API directly within module pages, with streaming responses
- **Prerequisite soft-gates** — Modules suggest (but don't require) prerequisite completion, with direct links
- **Concept connections** — Key terms link across modules, building a knowledge graph as you learn
- **Module completion celebration** — Confetti animation and skill-level-up reveal when you finish a module
- **Spaced repetition reviews** — Dashboard surfaces modules for review based on when you completed them
- **Learning goals** — Set target skill levels and track progress toward them
- **Shareable skills card** — Export your skills radar as a PNG for sharing progress
- **Syntax-highlighted code blocks** — Language badges, one-click copy, light/dark theme support
- **Dark mode** — Full dark theme with system preference detection and manual toggle
- **Skeleton loading states** — Content-aware placeholder UI on every page during data hydration
- **Smooth page transitions** — Fade/slide animations between routes
- **Per-route error boundaries** — Errors in one page don't break navigation; each route recovers independently
- **Rate limiting** — Server-side request throttling (20 req/min per IP) protects the API key

---

## Curriculum

41 modules across 5 role-specific learning paths, covering fundamentals through advanced production patterns (~8+ hours total). Module definitions are JSON, making the curriculum easy to extend.

### Shared Modules
These foundational modules are available across multiple paths:

| Module | Description | Difficulty |
|--------|-------------|------------|
| How Claude Thinks | Mental models for Claude's architecture, strengths, and limitations | Beginner |
| Prompt Engineering Essentials | System prompts, few-shot examples, chain-of-thought reasoning | Beginner |
| Claude for Content & Communication | Drafting, editing, research synthesis, and document analysis | Beginner |

### 🧭 Getting Started Path (11 modules)
For beginners exploring what AI can do and building a foundation for any path.

| Module | Description | Difficulty |
|--------|-------------|------------|
| What AI Can Do | A practical introduction to generative AI and Claude's capabilities | Beginner |
| Understanding AI Capabilities | How language models work, context windows, hallucinations, and training data | Beginner |
| AI for Everyday Tasks | Writing, brainstorming, organizing, and planning with Claude | Beginner |
| AI for Learning & Research | Using Claude as a tutor, research assistant, and study partner | Beginner |
| Evaluating AI Outputs | Critical thinking framework for assessing AI-generated content | Beginner |
| Fact-Checking with AI | Verification strategies and recognizing unverifiable claims | Intermediate |
| Responsible AI Use | Principles of responsible use — transparency, accountability, and privacy | Beginner |
| Navigating AI Ethics | Bias, fairness, societal impact, and the evolving regulatory landscape | Intermediate |

### 🛠️ Developer Path (12 modules)
For developers building with the Claude API and shipping AI-powered applications.

| Module | Description | Difficulty |
|--------|-------------|------------|
| Your First API Call | Messages API — authentication, request anatomy, response handling | Beginner |
| Structured Output | Reliably extracting JSON and structured data from Claude | Intermediate |
| Introduction to Tool Use | Function calling, tool schemas, and the tool use loop | Intermediate |
| Evaluator-Optimizer Loops | Building loops where Claude evaluates and improves its own outputs | Intermediate |
| Getting Started with Claude Code | Anthropic's agentic CLI for planning, writing, and debugging code | Intermediate |
| Building Systematic Evaluations | Designing rigorous evaluation suites for production AI systems | Advanced |
| Evaluating AI Use Cases | Framework for identifying, evaluating, and scoping AI use cases | Beginner |
| Responsible AI & Safety | Safety considerations, bias mitigation, data privacy, and guardrail design | Beginner |
| Deploying AI to Production | From prototype to production — infrastructure, monitoring, and reliability | Intermediate |

### 📊 Product Manager Path (12 modules)
For PMs evaluating AI opportunities, defining strategy, and managing AI-powered products.

| Module | Description | Difficulty |
|--------|-------------|------------|
| AI Product Strategy | Evaluating AI opportunities, defining success metrics, building product strategies | Intermediate |
| Measuring AI Product Success | KPIs, metrics frameworks, and data-driven AI product decisions | Intermediate |
| Evaluating AI Use Cases | Framework for identifying, evaluating, and scoping AI use cases | Beginner |
| Evaluator-Optimizer Loops | Building loops where Claude evaluates and improves its own outputs | Intermediate |
| Building Systematic Evaluations | Designing rigorous evaluation suites for production AI systems | Advanced |
| Communicating AI Value | Translating AI capabilities into stakeholder-friendly language | Beginner |
| Managing AI Projects | Planning, scoping, and executing AI projects across cross-functional teams | Intermediate |
| AI Governance for PMs | Governance frameworks, policies, and oversight for AI products | Intermediate |
| AI Risk Assessment | Identifying, evaluating, and mitigating risks in AI-powered products | Advanced |

### 🎨 Designer Path (11 modules)
For designers creating AI-powered interfaces, conversational experiences, and design systems.

| Module | Description | Difficulty |
|--------|-------------|------------|
| AI-Enhanced Creative Workflows | UX research synthesis, copy generation, and conversational UI prototyping | Intermediate |
| Designing AI Experiences | Design patterns for AI interfaces — loading states, confidence indicators, trust | Intermediate |
| Conversational UI Patterns | Anatomy of conversational interfaces — message types, input mechanisms, flows | Beginner |
| Chatbot UX Design | Personality design, conversation repair, onboarding, and measuring conversational UX | Intermediate |
| AI-Powered User Research | Using Claude to analyze qualitative data and generate research artifacts | Beginner |
| Design Synthesis with AI | From data to insights — personas, journey maps, and design recommendations | Intermediate |
| Rapid Prototyping with AI | AI-assisted ideation, UI copy generation, and interaction flow creation | Beginner |
| AI in Design Systems | AI components, accessibility auditing, and documentation maintenance | Intermediate |

### 💼 Business Path (11 modules)
For business professionals automating workflows, creating content, and measuring AI ROI.

| Module | Description | Difficulty |
|--------|-------------|------------|
| Automating Business Workflows | AI-powered templates, automation opportunities, and ROI measurement | Intermediate |
| Building AI Automations | Hands-on automation design — triggers, pipelines, and error handling | Intermediate |
| Evaluating AI Use Cases | Framework for identifying, evaluating, and scoping AI use cases | Beginner |
| AI-Powered Reporting | Generating reports, summaries, and data narratives with Claude | Beginner |
| Business Writing with AI | Professional communications, proposals, and documentation at scale | Intermediate |
| Measuring AI ROI | Quantifying the value of AI automation with metrics and cost-benefit analysis | Intermediate |
| AI Governance Essentials | Foundational governance concepts — policies, oversight, and compliance | Beginner |
| AI Compliance & Risk | Risk management frameworks, regulatory requirements, and mitigation strategies | Intermediate |

---

## Skill Dimensions

Each learning path tracks growth across its own five competency areas, tailored to what matters for that role. Each dimension is assessed at three levels: *Foundations*, *Practitioner*, and *Advanced*.

### Getting Started
- **AI Fundamentals** — Understanding what AI is and how language models work
- **Prompt Engineering** — Crafting effective prompts and system prompts
- **Practical Applications** — Using AI for everyday tasks, learning, and research
- **Critical Thinking** — Evaluating AI outputs and fact-checking with AI
- **AI Ethics** — Responsible use, bias awareness, and navigating ethical questions

### Developer
- **Prompt Engineering** — Crafting effective prompts and system prompts
- **API Integration** — Building with the Messages API and handling structured outputs
- **Agent Design** — Tool use, agentic workflows, and Claude Code
- **Evaluation & Testing** — Evaluator-optimizer patterns and systematic evals
- **Production Deployment** — Shipping AI to production with safety and reliability

### Product Manager
- **Prompt Engineering** — Crafting effective prompts and system prompts
- **AI Strategy** — Product strategy, opportunity evaluation, and metrics
- **Evaluation & Testing** — Evaluator-optimizer patterns and systematic evals
- **Stakeholder Communication** — Presenting AI capabilities, value, and project status
- **AI Governance** — Governance frameworks, risk assessment, and policy design

### Designer
- **Prompt Engineering** — Crafting effective prompts and system prompts
- **AI UX Design** — Interface patterns for AI-powered features
- **Conversational Design** — Chat interfaces, personality, and conversation repair
- **AI Research** — Using Claude for user research synthesis and analysis
- **Design Prototyping** — Rapid prototyping, design systems, and documentation

### Business
- **Prompt Engineering** — Crafting effective prompts and system prompts
- **Workflow Automation** — Building AI-powered business automations
- **Content & Communication** — Reports, business writing, and professional content
- **Evaluation & Testing** — Evaluator-optimizer patterns and systematic evals
- **AI Governance** — Governance, compliance, and risk management

---

## Architecture

```
claude-learn/
├── app/
│   ├── api/chat/route.ts              # Single API endpoint (5 modes: assessment, feedback, companion, playground, adapt)
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
│   └── modules/                       # 41 module definitions (JSON)
└── lib/
    ├── types.ts                       # Domain type definitions (profiles, skills, modules)
    ├── claude.ts                      # Anthropic SDK integration with streaming
    ├── modules.ts                     # Module registry and utilities
    ├── concepts.ts                    # Cross-module concept linking
    └── progress.ts                    # Profile serialization, session tracking, streak management
```

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
