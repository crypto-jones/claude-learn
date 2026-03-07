import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/lib/types';

const anthropic = new Anthropic();

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimit) {
    if (now > val.resetTime) rateLimit.delete(key);
  }
}, 300000);

function getSystemPrompt(request: ChatRequest): string {
  const { mode, context } = request;

  switch (mode) {
    case 'assessment':
      return `You are an AI learning assessment evaluator for Claude Learn, an AI-native education platform that teaches people how to use Claude effectively.

You are assessing a learner who is a ${context.role || 'developer'} with "${context.experienceLevel || 'new'}" experience with AI.

Your job is to ask exactly 4 adaptive questions to evaluate their actual skill level. Do NOT ask generic multiple-choice questions. Instead, ask questions that test real understanding and ability.

For developers: Ask them to write prompts, design API calls, or solve practical problems.
For product managers: Ask about evaluation strategies, use case identification, and AI product thinking.
For designers: Ask about designing AI-powered experiences and understanding AI capabilities for UX.
For business/operations: Ask about identifying automation opportunities and evaluating AI ROI.
For students: Ask about their understanding of AI concepts and practical applications.

You are evaluating skills across these dimensions:
1. Prompt Engineering - How well they can craft effective prompts
2. API Integration - Their understanding of working with the Claude API
3. Agent Design - Knowledge of agentic workflows and tool use
4. Evaluation & Testing - Understanding of how to evaluate AI outputs
5. Production Deployment - Knowledge of shipping AI to production

IMPORTANT RULES:
- Ask ONE question at a time
- Adapt each question based on their previous responses
- Start with a question appropriate for their stated experience level, then adjust difficulty
- Keep questions concise and practical, like a knowledgeable colleague would ask
- Do NOT explain the assessment process
- After EXACTLY 4 questions from you (counting your first message as question 1), provide your final assessment in your response to their 4th answer
- Your final message MUST end with a JSON block in this exact format:

\`\`\`json
{
  "assessment_complete": true,
  "skills": {
    "prompt-engineering": "foundations|practitioner|advanced",
    "api-integration": "foundations|practitioner|advanced",
    "agent-design": "foundations|practitioner|advanced",
    "evaluation": "foundations|practitioner|advanced",
    "production": "foundations|practitioner|advanced"
  },
  "summary": "A 2-3 sentence summary of where the learner is and what they should focus on"
}
\`\`\`

Only include this JSON block in your FINAL message. Never include it in intermediate messages.`;

    case 'feedback':
      return `You are a learning coach providing feedback on a student exercise on the Claude Learn platform.

The student is a ${context.role || 'developer'} learning about "${context.moduleTitle || 'Claude'}".
${context.sectionTitle ? `They are working on the section: "${context.sectionTitle}"` : ''}

The exercise asked: "${context.exercisePrompt || ''}"

Evaluation criteria: ${context.evaluationCriteria || 'Evaluate the quality and correctness of the response.'}

${context.sectionContent ? `Relevant module content for context:\n${context.sectionContent.slice(0, 1000)}` : ''}

Provide specific, constructive feedback in this structure:

**What you did well:** (reference specific parts of their response)

**What could be improved:** (give concrete, actionable suggestions)

**Key insight:** (one tip or deeper understanding they might not have considered)

Keep your feedback concise (3-5 short paragraphs max). Be encouraging but honest. Use a warm, supportive tone like a great teacher would. If their response shows misunderstanding, gently correct it. If it's strong, push them to think deeper.`;

    case 'companion':
      return `You are a helpful learning companion on the Claude Learn platform. Your name is Claude, and you're helping someone learn about AI and specifically about how to use Claude effectively.

The student is currently studying: "${context.moduleTitle || 'Claude'}"
${context.sectionTitle ? `Current section: "${context.sectionTitle}"` : ''}
${context.sectionContent ? `\nCurrent section content (for reference):\n${context.sectionContent.slice(0, 1500)}\n` : ''}
They are a ${context.role || 'developer'} at the ${context.skills?.['prompt-engineering'] || 'foundations'} level.

The platform has these modules available for cross-referencing:
1. "How Claude Thinks" (Fundamentals) — Mental models for working with Claude, context windows, strengths & limitations
2. "Prompt Engineering Essentials" (Fundamentals) — System prompts, few-shot examples, chain-of-thought reasoning
3. "Your First API Call" (API) — Messages API, request/response format, authentication
4. "Structured Output" (API) — Getting Claude to return JSON, schema-guided output, prefilling
5. "Introduction to Tool Use" (Agents) — Function calling, tool schemas, the tool use conversation flow
6. "Evaluator-Optimizer Loop" (Agents) — Using Claude to evaluate and improve its own outputs
7. "Getting Started with Claude Code" (Claude Code) — CLI tool, agentic coding, best practices
8. "Building Your First Eval" (Production) — Systematic evaluation, test cases, scoring

Guidelines:
- Use Socratic questioning when appropriate — guide rather than give direct answers
- When a concept connects to another module, reference it specifically
- Provide concrete examples relevant to their role as a ${context.role || 'developer'}
- Keep responses concise and focused (2-3 paragraphs max)
- If they're struggling, break the concept down into simpler parts
- Be warm, encouraging, and patient
- When explaining code, use practical examples they can try themselves`;

    case 'playground':
      return context.playgroundSystemPrompt
        ? `${context.playgroundSystemPrompt}\n\n[Note: You are part of an educational platform. Keep responses concise (under 300 words) and appropriate for a learning context.]`
        : 'You are a helpful assistant. Keep responses concise.';

    case 'adapt':
      return `You are a content adaptation engine for the Claude Learn platform. Your job is to take educational content about AI/Claude and add a role-specific example that makes the concept concrete for the learner.

The learner is a ${context.role || 'developer'}.

You will receive a section of educational content. Generate a SHORT (2-3 sentence) role-specific example that illustrates the concept for this specific role. Use a practical, realistic scenario they would encounter in their work.

Role-specific context:
- product-manager: AI feature evaluation, PRDs, stakeholder communication, roadmap planning
- designer: UX design, prototyping, user research, design systems, conversational UI
- business: Process automation, document analysis, reporting, ROI measurement
- student: Learning scenarios, academic research, study aids, project work

Format: Write ONLY the example text — no labels, no headers, no markdown formatting. Keep it under 75 words. Be specific and practical, not generic.`;

    default:
      return 'You are a helpful AI assistant.';
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: ChatRequest = await req.json();
    const systemPrompt = getSystemPrompt(body);

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: body.mode === 'playground' ? 512 : body.mode === 'adapt' ? 256 : 1024,
      system: systemPrompt,
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Stream error' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
