import { Module, LearnerRole } from './types';

import howClaudeThinks from '@/content/modules/how-claude-thinks.json';
import promptEngineering from '@/content/modules/prompt-engineering.json';
import firstApiCall from '@/content/modules/first-api-call.json';
import structuredOutput from '@/content/modules/structured-output.json';
import toolUseIntro from '@/content/modules/tool-use-intro.json';
import evaluatorOptimizer from '@/content/modules/evaluator-optimizer.json';
import claudeCodeIntro from '@/content/modules/claude-code-intro.json';
import buildingEvals from '@/content/modules/building-evals.json';
import evaluatingAiUseCases from '@/content/modules/evaluating-ai-use-cases.json';
import responsibleAiSafety from '@/content/modules/responsible-ai-safety.json';
import claudeForContent from '@/content/modules/claude-for-content.json';
import aiProductStrategy from '@/content/modules/ai-product-strategy.json';
import aiCreativeWorkflows from '@/content/modules/ai-creative-workflows.json';
import aiBusinessWorkflows from '@/content/modules/ai-business-workflows.json';

export const moduleMap: Record<string, Module> = {
  'how-claude-thinks': howClaudeThinks as unknown as Module,
  'prompt-engineering': promptEngineering as unknown as Module,
  'first-api-call': firstApiCall as unknown as Module,
  'structured-output': structuredOutput as unknown as Module,
  'tool-use-intro': toolUseIntro as unknown as Module,
  'evaluator-optimizer': evaluatorOptimizer as unknown as Module,
  'claude-code-intro': claudeCodeIntro as unknown as Module,
  'building-evals': buildingEvals as unknown as Module,
  'evaluating-ai-use-cases': evaluatingAiUseCases as unknown as Module,
  'responsible-ai-safety': responsibleAiSafety as unknown as Module,
  'claude-for-content': claudeForContent as unknown as Module,
  'ai-product-strategy': aiProductStrategy as unknown as Module,
  'ai-creative-workflows': aiCreativeWorkflows as unknown as Module,
  'ai-business-workflows': aiBusinessWorkflows as unknown as Module,
};

export const allModuleIds: string[] = Object.keys(moduleMap);

export function getModule(id: string): Module | undefined {
  return moduleMap[id];
}

export function getModulesByRole(role: LearnerRole | null): Module[] {
  return Object.values(moduleMap).filter(
    (m) => !m.targetRoles || m.targetRoles.length === 0 || m.targetRoles.includes(role as LearnerRole)
  );
}

export function getModulesByTrack(trackId: string): Module[] {
  return Object.values(moduleMap).filter((m) => m.track === trackId);
}
