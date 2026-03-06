import { ChatMessage, ChatRequest } from './types';

export async function streamChat(
  request: ChatRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              onChunk(parsed.text);
            }
            if (parsed.error) {
              onError?.(parsed.error);
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
    onDone();
  } catch (error) {
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
}

export function extractAssessmentResult(
  content: string
): { skills: Record<string, string>; summary: string } | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.assessment_complete && parsed.skills) {
      return { skills: parsed.skills, summary: parsed.summary || '' };
    }
  } catch {
    // Invalid JSON
  }
  return null;
}

export function generateLearningPath(
  skills: Record<string, string>,
  role: string
): string[] {
  const allModules = [
    'how-claude-thinks',
    'prompt-engineering',
    'first-api-call',
    'structured-output',
    'tool-use-intro',
  ];

  // Simple path generation: prioritize modules for weaker skills
  const skillToModule: Record<string, string[]> = {
    'prompt-engineering': ['how-claude-thinks', 'prompt-engineering'],
    'api-integration': ['first-api-call', 'structured-output'],
    'agent-design': ['tool-use-intro'],
    evaluation: [],
    production: [],
  };

  const ordered: string[] = [];
  const skillEntries = Object.entries(skills).sort((a, b) => {
    const levelOrder = { foundations: 0, practitioner: 1, advanced: 2 };
    return (
      (levelOrder[a[1] as keyof typeof levelOrder] || 0) -
      (levelOrder[b[1] as keyof typeof levelOrder] || 0)
    );
  });

  for (const [skill] of skillEntries) {
    const modules = skillToModule[skill] || [];
    for (const mod of modules) {
      if (!ordered.includes(mod)) {
        ordered.push(mod);
      }
    }
  }

  // Add any remaining modules
  for (const mod of allModules) {
    if (!ordered.includes(mod)) {
      ordered.push(mod);
    }
  }

  return ordered;
}
