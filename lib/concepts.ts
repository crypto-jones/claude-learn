/**
 * Concept connection map — maps concept phrases found in module content
 * to specific module sections, enabling cross-referencing between modules.
 *
 * Each entry maps a display phrase to its source module + section.
 * Phrases are matched case-insensitively in content text.
 * Longer phrases are matched first to avoid partial matches.
 */

export interface ConceptLink {
  moduleId: string;
  sectionId: string;
  label: string; // display text for the link
}

// Map of lowercase phrase → concept link
const conceptEntries: Array<{ phrase: string; link: ConceptLink }> = [
  // How Claude Thinks
  { phrase: 'context window', link: { moduleId: 'how-claude-thinks', sectionId: 'context-window', label: 'The Context Window' } },
  { phrase: 'hallucination', link: { moduleId: 'how-claude-thinks', sectionId: 'limitations', label: 'Where Claude Struggles' } },
  { phrase: 'hallucinate', link: { moduleId: 'how-claude-thinks', sectionId: 'limitations', label: 'Where Claude Struggles' } },

  // Prompt Engineering
  { phrase: 'system prompt', link: { moduleId: 'prompt-engineering', sectionId: 'system-prompts', label: 'System Prompts' } },
  { phrase: 'system prompts', link: { moduleId: 'prompt-engineering', sectionId: 'system-prompts', label: 'System Prompts' } },
  { phrase: 'few-shot', link: { moduleId: 'prompt-engineering', sectionId: 'few-shot', label: 'Few-Shot Examples' } },
  { phrase: 'few shot', link: { moduleId: 'prompt-engineering', sectionId: 'few-shot', label: 'Few-Shot Examples' } },
  { phrase: 'chain-of-thought', link: { moduleId: 'prompt-engineering', sectionId: 'chain-of-thought', label: 'Chain-of-Thought Reasoning' } },
  { phrase: 'chain of thought', link: { moduleId: 'prompt-engineering', sectionId: 'chain-of-thought', label: 'Chain-of-Thought Reasoning' } },

  // First API Call
  { phrase: 'messages api', link: { moduleId: 'first-api-call', sectionId: 'messages-api', label: 'The Messages API' } },

  // Structured Output
  { phrase: 'structured output', link: { moduleId: 'structured-output', sectionId: 'why-structured', label: 'Structured Output' } },

  // Tool Use
  { phrase: 'tool use', link: { moduleId: 'tool-use-intro', sectionId: 'what-is-tool-use', label: 'Tool Use' } },
  { phrase: 'tool schemas', link: { moduleId: 'tool-use-intro', sectionId: 'tool-schemas', label: 'Tool Schemas' } },

  // Evaluator-Optimizer
  { phrase: 'evaluator-optimizer', link: { moduleId: 'evaluator-optimizer', sectionId: 'pattern-overview', label: 'Evaluator-Optimizer Pattern' } },
  { phrase: 'agentic loop', link: { moduleId: 'evaluator-optimizer', sectionId: 'pattern-overview', label: 'Evaluator-Optimizer Pattern' } },

  // Building Evals
  { phrase: 'building evals', link: { moduleId: 'building-evals', sectionId: 'eval-approaches', label: 'Building Evals' } },
];

// Sort by phrase length descending so longer phrases match first
const sortedEntries = [...conceptEntries].sort((a, b) => b.phrase.length - a.phrase.length);

/**
 * Given a module ID and section ID, inject concept links into HTML text.
 * Skips linking to the current module/section to avoid self-referencing.
 * Only links the first occurrence of each concept per text block.
 */
export function injectConceptLinks(html: string, currentModuleId: string, currentSectionId: string): string {
  const linkedConcepts = new Set<string>();

  let result = html;
  for (const entry of sortedEntries) {
    // Don't link to the current module+section
    if (entry.link.moduleId === currentModuleId && entry.link.sectionId === currentSectionId) continue;
    // Don't link the same concept twice
    if (linkedConcepts.has(entry.link.moduleId + ':' + entry.link.sectionId)) continue;

    // Match phrase (case-insensitive) but NOT inside HTML tags or existing links
    const escaped = entry.phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<![<\\w/])\\b(${escaped})\\b(?![^<]*>)`, 'i');
    const match = result.match(regex);

    if (match && match.index !== undefined) {
      const original = match[1];
      const link = `<a href="/learn/${entry.link.moduleId}?section=${entry.link.sectionId}" class="text-primary hover:underline underline-offset-2 decoration-primary/30" title="${entry.link.label}">${original}</a>`;
      result = result.slice(0, match.index) + link + result.slice(match.index + original.length);
      linkedConcepts.add(entry.link.moduleId + ':' + entry.link.sectionId);
    }
  }

  return result;
}
