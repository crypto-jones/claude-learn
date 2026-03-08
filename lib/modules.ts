import { Module, LearnerRole, SkillDimension, ROLE_SKILL_DIMENSIONS, ALL_SKILL_DIMENSIONS } from './types';

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

// Developer path
import deployingAiProduction from '@/content/modules/deploying-ai-production.json';

// Product Manager path
import aiProductMetrics from '@/content/modules/ai-product-metrics.json';
import communicatingAiValue from '@/content/modules/communicating-ai-value.json';
import managingAiProjects from '@/content/modules/managing-ai-projects.json';
import aiGovernanceForPms from '@/content/modules/ai-governance-for-pms.json';
import aiRiskAssessment from '@/content/modules/ai-risk-assessment.json';

// Designer path
import designingAiExperiences from '@/content/modules/designing-ai-experiences.json';
import conversationalUiPatterns from '@/content/modules/conversational-ui-patterns.json';
import chatbotUxDesign from '@/content/modules/chatbot-ux-design.json';
import aiPoweredUserResearch from '@/content/modules/ai-powered-user-research.json';
import designSynthesisWithAi from '@/content/modules/design-synthesis-with-ai.json';
import rapidPrototypingWithAi from '@/content/modules/rapid-prototyping-with-ai.json';
import aiInDesignSystems from '@/content/modules/ai-in-design-systems.json';

// Business path
import buildingAiAutomations from '@/content/modules/building-ai-automations.json';
import aiPoweredReporting from '@/content/modules/ai-powered-reporting.json';
import businessWritingWithAi from '@/content/modules/business-writing-with-ai.json';
import measuringAiRoi from '@/content/modules/measuring-ai-roi.json';
import aiGovernanceEssentials from '@/content/modules/ai-governance-essentials.json';
import aiComplianceRisk from '@/content/modules/ai-compliance-risk.json';

// Getting Started path
import whatAiCanDo from '@/content/modules/what-ai-can-do.json';
import understandingAiCapabilities from '@/content/modules/understanding-ai-capabilities.json';
import aiForEverydayTasks from '@/content/modules/ai-for-everyday-tasks.json';
import aiForLearningResearch from '@/content/modules/ai-for-learning-research.json';
import evaluatingAiOutputs from '@/content/modules/evaluating-ai-outputs.json';
import factCheckingWithAi from '@/content/modules/fact-checking-with-ai.json';
import responsibleAiUse from '@/content/modules/responsible-ai-use.json';
import navigatingAiEthics from '@/content/modules/navigating-ai-ethics.json';

export const moduleMap: Record<string, Module> = {
  // Shared / Fundamentals
  'how-claude-thinks': howClaudeThinks as unknown as Module,
  'prompt-engineering': promptEngineering as unknown as Module,
  'claude-for-content': claudeForContent as unknown as Module,

  // Developer path
  'first-api-call': firstApiCall as unknown as Module,
  'structured-output': structuredOutput as unknown as Module,
  'tool-use-intro': toolUseIntro as unknown as Module,
  'evaluator-optimizer': evaluatorOptimizer as unknown as Module,
  'claude-code-intro': claudeCodeIntro as unknown as Module,
  'building-evals': buildingEvals as unknown as Module,
  'evaluating-ai-use-cases': evaluatingAiUseCases as unknown as Module,
  'responsible-ai-safety': responsibleAiSafety as unknown as Module,
  'deploying-ai-production': deployingAiProduction as unknown as Module,

  // Product Manager path
  'ai-product-strategy': aiProductStrategy as unknown as Module,
  'ai-product-metrics': aiProductMetrics as unknown as Module,
  'communicating-ai-value': communicatingAiValue as unknown as Module,
  'managing-ai-projects': managingAiProjects as unknown as Module,
  'ai-governance-for-pms': aiGovernanceForPms as unknown as Module,
  'ai-risk-assessment': aiRiskAssessment as unknown as Module,

  // Designer path
  'ai-creative-workflows': aiCreativeWorkflows as unknown as Module,
  'designing-ai-experiences': designingAiExperiences as unknown as Module,
  'conversational-ui-patterns': conversationalUiPatterns as unknown as Module,
  'chatbot-ux-design': chatbotUxDesign as unknown as Module,
  'ai-powered-user-research': aiPoweredUserResearch as unknown as Module,
  'design-synthesis-with-ai': designSynthesisWithAi as unknown as Module,
  'rapid-prototyping-with-ai': rapidPrototypingWithAi as unknown as Module,
  'ai-in-design-systems': aiInDesignSystems as unknown as Module,

  // Business path
  'ai-business-workflows': aiBusinessWorkflows as unknown as Module,
  'building-ai-automations': buildingAiAutomations as unknown as Module,
  'ai-powered-reporting': aiPoweredReporting as unknown as Module,
  'business-writing-with-ai': businessWritingWithAi as unknown as Module,
  'measuring-ai-roi': measuringAiRoi as unknown as Module,
  'ai-governance-essentials': aiGovernanceEssentials as unknown as Module,
  'ai-compliance-risk': aiComplianceRisk as unknown as Module,

  // Getting Started path
  'what-ai-can-do': whatAiCanDo as unknown as Module,
  'understanding-ai-capabilities': understandingAiCapabilities as unknown as Module,
  'ai-for-everyday-tasks': aiForEverydayTasks as unknown as Module,
  'ai-for-learning-research': aiForLearningResearch as unknown as Module,
  'evaluating-ai-outputs': evaluatingAiOutputs as unknown as Module,
  'fact-checking-with-ai': factCheckingWithAi as unknown as Module,
  'responsible-ai-use': responsibleAiUse as unknown as Module,
  'navigating-ai-ethics': navigatingAiEthics as unknown as Module,
};

export const allModuleIds: string[] = Object.keys(moduleMap);

export function getModule(id: string): Module | undefined {
  return moduleMap[id];
}

export function getModulesByRole(role: LearnerRole | null): Module[] {
  const roleDims = role ? new Set(getDimensionsForRole(role)) : null;
  return Object.values(moduleMap).filter((m) => {
    // If module targets specific roles, check inclusion
    if (m.targetRoles && m.targetRoles.length > 0) {
      if (!m.targetRoles.includes(role as LearnerRole)) return false;
    }
    // Only include modules whose dimension is in the role's set
    if (roleDims && !roleDims.has(m.skillDimension)) return false;
    return true;
  });
}

/** Return the skill dimension IDs for a role */
export function getDimensionsForRole(role: LearnerRole | null): SkillDimension[] {
  if (!role) return ROLE_SKILL_DIMENSIONS['getting-started'].map((d) => d.id);
  return ROLE_SKILL_DIMENSIONS[role].map((d) => d.id);
}

export function getModulesByTrack(trackId: string): Module[] {
  return Object.values(moduleMap).filter((m) => m.track === trackId);
}

/** Return the skill dimensions reachable from a learning path, in canonical order. */
export function getReachableDimensions(learningPath: string[]): SkillDimension[] {
  if (learningPath.length === 0) return ALL_SKILL_DIMENSIONS.map((d) => d.id);
  const reachable = new Set<SkillDimension>();
  for (const id of learningPath) {
    const mod = moduleMap[id];
    if (mod) reachable.add(mod.skillDimension);
  }
  return ALL_SKILL_DIMENSIONS.filter((d) => reachable.has(d.id)).map((d) => d.id);
}
