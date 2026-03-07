import { ChatMessage, ChatRequest, LearnerRole } from './types';
import { getModulesByRole } from './modules';

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
  const roleModules = getModulesByRole(role as LearnerRole);

  // Role-specific track priority determines module ordering
  const roleTrackPriority: Record<string, string[]> = {
    developer: ['fundamentals', 'api', 'agents', 'claude-code', 'production'],
    'product-manager': ['fundamentals', 'production', 'agents'],
    designer: ['fundamentals'],
    business: ['fundamentals'],
    student: ['fundamentals', 'api', 'agents', 'production'],
  };

  const trackPriority = roleTrackPriority[role] || ['fundamentals'];
  const levelOrder: Record<string, number> = { foundations: 0, practitioner: 1, advanced: 2 };
  const diffOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

  // Score each module by: weakest skill first, then track priority, then difficulty
  const scored = roleModules.map((mod) => {
    const skillLevel = skills[mod.skillDimension] || 'foundations';
    const skillScore = levelOrder[skillLevel] ?? 0;
    const trackIndex = trackPriority.indexOf(mod.track);
    const trackScore = trackIndex >= 0 ? trackIndex : 99;
    const diffScore = diffOrder[mod.difficulty] ?? 1;
    return { id: mod.id, prerequisites: mod.prerequisites, skillScore, trackScore, diffScore };
  });

  scored.sort((a, b) => {
    if (a.skillScore !== b.skillScore) return a.skillScore - b.skillScore;
    if (a.trackScore !== b.trackScore) return a.trackScore - b.trackScore;
    return a.diffScore - b.diffScore;
  });

  // Topological sort: ensure prerequisites come before dependents
  const ids = scored.map((s) => s.id);
  const prereqMap = new Map(scored.map((s) => [s.id, s.prerequisites]));
  const result: string[] = [];
  const placed = new Set<string>();
  const roleModuleIds = new Set(ids);

  function place(id: string) {
    if (placed.has(id)) return;
    const prereqs = prereqMap.get(id) || [];
    for (const p of prereqs) {
      if (roleModuleIds.has(p)) place(p);
    }
    placed.add(id);
    result.push(id);
  }

  for (const id of ids) {
    place(id);
  }

  return result;
}
