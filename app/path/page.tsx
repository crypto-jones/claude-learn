'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLearner } from '@/contexts/LearnerContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Module,
  SkillDimension,
  SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
} from '@/lib/types';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  AlertCircle,
  Focus,
} from 'lucide-react';

// Import modules statically
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

const moduleMap: Record<string, Module> = {
  'how-claude-thinks': howClaudeThinks as Module,
  'prompt-engineering': promptEngineering as Module,
  'first-api-call': firstApiCall as Module,
  'structured-output': structuredOutput as Module,
  'tool-use-intro': toolUseIntro as Module,
  'evaluator-optimizer': evaluatorOptimizer as Module,
  'claude-code-intro': claudeCodeIntro as Module,
  'building-evals': buildingEvals as Module,
  'evaluating-ai-use-cases': evaluatingAiUseCases as Module,
  'responsible-ai-safety': responsibleAiSafety as Module,
  'claude-for-content': claudeForContent as Module,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

// Map skill dimensions to a human-friendly recommendation reason
function getRecommendationReason(
  module: Module,
  skills: Record<SkillDimension, string>
): string | null {
  const level = skills[module.skillDimension];
  if (level === 'foundations') {
    const dimLabel = SKILL_DIMENSIONS.find((d) => d.id === module.skillDimension)?.label;
    return `You scored Foundations on ${dimLabel} — this module builds that skill`;
  }
  if (level === 'practitioner') {
    const dimLabel = SKILL_DIMENSIONS.find((d) => d.id === module.skillDimension)?.label;
    return `Strengthen your ${dimLabel} skills from Practitioner toward Advanced`;
  }
  return null;
}

// Focus areas for dynamic reordering
const FOCUS_AREAS = [
  { id: 'recommended', label: 'Recommended Order', description: 'Based on your assessment' },
  { id: 'fundamentals', label: 'Fundamentals First', description: 'Start with core concepts' },
  { id: 'api', label: 'API & Integration', description: 'Focus on building with the API' },
  { id: 'agents', label: 'Agents & Tools', description: 'Focus on agentic workflows' },
] as const;

type FocusArea = (typeof FOCUS_AREAS)[number]['id'];

function reorderModules(
  modules: Module[],
  focus: FocusArea,
  learningPath: string[],
  completedModules: string[]
): Module[] {
  if (focus === 'recommended') {
    // Use the assessment-generated order
    const ordered = learningPath
      .map((id) => moduleMap[id])
      .filter(Boolean);
    Object.values(moduleMap).forEach((mod) => {
      if (!ordered.find((m) => m.id === mod.id)) ordered.push(mod);
    });
    return ordered;
  }

  // For other focuses, prioritize the matching track, then the rest
  const trackPriority: Record<string, string[]> = {
    fundamentals: ['fundamentals', 'api', 'agents'],
    api: ['api', 'fundamentals', 'agents'],
    agents: ['agents', 'api', 'fundamentals'],
  };

  const priority = trackPriority[focus] || ['fundamentals', 'api', 'agents'];

  return [...modules].sort((a, b) => {
    // Completed modules go to the end
    const aCompleted = completedModules.includes(a.id);
    const bCompleted = completedModules.includes(b.id);
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;

    // Sort by track priority
    const aTrackIndex = priority.indexOf(a.track);
    const bTrackIndex = priority.indexOf(b.track);
    if (aTrackIndex !== bTrackIndex) return aTrackIndex - bTrackIndex;

    return 0;
  });
}

export default function PathPage() {
  const router = useRouter();
  const { profile, isLoaded, setLearningPath } = useLearner();
  const [modules, setModules] = useState<Module[]>([]);
  const [focusArea, setFocusArea] = useState<FocusArea>('recommended');
  const [prereqDialogOpen, setPrereqDialogOpen] = useState(false);
  const [pendingModule, setPendingModule] = useState<{ id: string; unmet: string[] } | null>(null);

  // Redirect if not assessed
  useEffect(() => {
    if (isLoaded && !profile.assessmentComplete) {
      router.push('/assess');
    }
  }, [isLoaded, profile.assessmentComplete, router]);

  // Reorder modules when focus changes
  useEffect(() => {
    if (!isLoaded || !profile.assessmentComplete) return;

    const allModules = Object.values(moduleMap);
    const ordered = reorderModules(
      allModules,
      focusArea,
      profile.learningPath,
      profile.completedModules
    );
    setModules(ordered);
  }, [isLoaded, profile.assessmentComplete, profile.completedModules, focusArea]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded || !profile.assessmentComplete) {
    return null;
  }

  const completedCount = profile.completedModules.length;
  const totalCount = modules.length;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary/60" />
            <span className="text-sm font-medium text-primary">
              Personalized for you
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-3">
            Your Learning Path
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Based on your assessment, here&apos;s a curated sequence of modules
            ordered by what you need most. Adjust your focus to reorder the path.
          </p>
        </div>

        {/* Skills snapshot */}
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Skills Snapshot
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {completedCount}/{totalCount} modules completed
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {SKILL_DIMENSIONS.map((dim) => {
              const level = profile.skills[dim.id];
              const value = SKILL_LEVEL_VALUES[level];
              return (
                <div key={dim.id} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1.5 truncate">
                    {dim.label.split(' ')[0]}
                  </div>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3].map((v) => (
                      <div
                        key={v}
                        className={`h-2 w-2 rounded-full ${
                          v <= value ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 capitalize">
                    {level}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Focus area selector — dynamic path reordering */}
        <Card className="p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Focus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Adjust Your Focus
            </h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setFocusArea(area.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  focusArea === area.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {area.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {FOCUS_AREAS.find((a) => a.id === focusArea)?.description}
          </p>
        </Card>

        {/* Module list */}
        <div className="space-y-4">
          {modules.map((module, index) => {
            const isCompleted = profile.completedModules.includes(module.id);
            const isStarted = profile.moduleProgress[module.id]?.started;
            const recommendation = getRecommendationReason(module, profile.skills);

            // Check prerequisites
            const prereqsMet = module.prerequisites.every((preId) =>
              profile.completedModules.includes(preId)
            );
            const unmetPrereqs = module.prerequisites
              .filter((preId) => !profile.completedModules.includes(preId))
              .map((preId) => moduleMap[preId]?.title)
              .filter(Boolean);

            const handleModuleClick = () => {
              if (!prereqsMet && !isCompleted) {
                setPendingModule({ id: module.id, unmet: unmetPrereqs });
                setPrereqDialogOpen(true);
                return;
              }
              router.push(`/learn/${module.id}`);
            };

            return (
              <div key={module.id} onClick={handleModuleClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModuleClick(); } }}>
                <Card
                  className={`p-5 transition-all hover:border-border/80 hover:shadow-sm cursor-pointer ${
                    isCompleted ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : isStarted ? (
                        <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${difficultyColors[module.difficulty]}`}
                        >
                          {module.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {module.trackTitle}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {module.description}
                      </p>

                      {/* Metadata row: time + prerequisites */}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {module.estimatedMinutes} min
                        </span>
                        {module.prerequisites.length > 0 && (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              prereqsMet
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {prereqsMet ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {prereqsMet
                              ? 'Prerequisites met'
                              : `Requires: ${unmetPrereqs.join(', ')}`}
                          </span>
                        )}
                      </div>

                      {/* Personalized recommendation reason */}
                      {recommendation && !isCompleted && (
                        <p className="text-xs text-primary mt-2 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 shrink-0" />
                          {recommendation}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="pt-1">
                      {isCompleted ? (
                        <span className="text-xs text-muted-foreground">
                          Review
                        </span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* View Dashboard link */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              View Skills Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={prereqDialogOpen}
        onOpenChange={setPrereqDialogOpen}
        title="Prerequisites Not Met"
        description={pendingModule ? `This module requires: ${pendingModule.unmet.join(', ')}. Continue anyway?` : ''}
        confirmLabel="Continue Anyway"
        onConfirm={() => { if (pendingModule) router.push(`/learn/${pendingModule.id}`); }}
      />
    </div>
  );
}
