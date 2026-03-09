import { ChatMessage, ChatRequest, LearnerRole } from './types';
import { getModulesByRole } from './modules';

const STREAM_TIMEOUT = 30000; // 30 seconds per chunk

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
      // Parse structured error messages from API validation
      let errorMsg = `API error: ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody.error) errorMsg = errBody.error;
      } catch { /* use default */ }
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // Race against timeout to prevent infinite hangs
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Response timed out. Please try again.')), STREAM_TIMEOUT)
        );
        const { done, value } = await Promise.race([reader.read(), timeoutPromise]);
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
    } finally {
      reader.cancel().catch(() => {});
    }
  } catch (error) {
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
}

export function extractAssessmentResult(
  content: string
): { skills: Record<string, string>; summary: string } | null {
  // Try fenced code block first (```json...``` or ```...```)
  const fencedMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  // Fall back to bare JSON object with assessment_complete key
  const bareMatch = !fencedMatch ? content.match(/(\{[\s\S]*?"assessment_complete"[\s\S]*?\})/) : null;
  const jsonStr = fencedMatch?.[1] || bareMatch?.[1];
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr);
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
    'product-manager': ['fundamentals', 'strategy', 'evaluation', 'stakeholders', 'governance'],
    designer: ['fundamentals', 'ux-design', 'conversational', 'research', 'prototyping'],
    business: ['fundamentals', 'automation', 'content', 'impact', 'governance'],
    'getting-started': ['fundamentals', 'prompting', 'applications', 'thinking', 'ethics'],
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
