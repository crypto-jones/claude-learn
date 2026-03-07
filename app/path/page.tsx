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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Module,
  SkillDimension,
  SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
  LEARNER_ROLES,
} from '@/lib/types';
import { moduleMap, getModulesByRole } from '@/lib/modules';
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

// Role-specific subtitles
const roleSubtitles: Record<string, string> = {
  developer: 'Master the Claude API, build agentic workflows, and ship production AI.',
  'product-manager': 'Evaluate AI opportunities, define success metrics, and lead AI product strategy.',
  designer: 'Design AI-powered experiences and integrate Claude into creative workflows.',
  business: 'Automate workflows, analyze documents, and measure AI ROI.',
  student: 'Build a strong foundation in AI concepts and practical Claude skills.',
};

// Focus areas for dynamic reordering — adapted per role
type FocusAreaItem = { id: string; label: string; description: string };

function getFocusAreas(role: string | null): FocusAreaItem[] {
  const base: FocusAreaItem[] = [
    { id: 'recommended', label: 'Recommended Order', description: 'Based on your assessment' },
    { id: 'fundamentals', label: 'Fundamentals First', description: 'Start with core concepts' },
  ];

  if (role === 'developer' || role === 'student') {
    base.push(
      { id: 'api', label: 'API & Integration', description: 'Focus on building with the API' },
      { id: 'agents', label: 'Agents & Tools', description: 'Focus on agentic workflows' },
    );
  }
  if (role === 'product-manager') {
    base.push(
      { id: 'production', label: 'Evaluation & Strategy', description: 'Focus on evals and AI strategy' },
    );
  }
  return base;
}

type FocusArea = string;

function reorderModules(
  roleModules: Module[],
  focus: FocusArea,
  learningPath: string[],
  completedModules: string[]
): Module[] {
  if (focus === 'recommended') {
    // Use the assessment-generated order, then append any role modules not in path
    const roleModuleIds = new Set(roleModules.map((m) => m.id));
    const ordered = learningPath
      .filter((id) => roleModuleIds.has(id))
      .map((id) => moduleMap[id])
      .filter(Boolean);
    roleModules.forEach((mod) => {
      if (!ordered.find((m) => m.id === mod.id)) ordered.push(mod);
    });
    return ordered;
  }

  // For other focuses, prioritize the matching track, then the rest
  const trackPriority: Record<string, string[]> = {
    fundamentals: ['fundamentals', 'api', 'agents', 'claude-code', 'production'],
    api: ['api', 'fundamentals', 'agents'],
    agents: ['agents', 'api', 'fundamentals'],
    production: ['production', 'agents', 'fundamentals'],
  };

  const priority = trackPriority[focus] || ['fundamentals', 'api', 'agents'];

  return [...roleModules].sort((a, b) => {
    // Completed modules go to the end
    const aCompleted = completedModules.includes(a.id);
    const bCompleted = completedModules.includes(b.id);
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;

    // Sort by track priority
    const aTrackIndex = priority.indexOf(a.track);
    const bTrackIndex = priority.indexOf(b.track);
    const aIdx = aTrackIndex >= 0 ? aTrackIndex : 99;
    const bIdx = bTrackIndex >= 0 ? bTrackIndex : 99;
    if (aIdx !== bIdx) return aIdx - bIdx;

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

  // Reorder modules when focus changes — filtered by role
  useEffect(() => {
    if (!isLoaded || !profile.assessmentComplete) return;

    const roleModules = getModulesByRole(profile.role);
    const ordered = reorderModules(
      roleModules,
      focusArea,
      profile.learningPath,
      profile.completedModules
    );
    setModules(ordered);
  }, [isLoaded, profile.assessmentComplete, profile.completedModules, profile.role, focusArea]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded || !profile.assessmentComplete) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-10">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card className="p-5 mb-6">
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="flex gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </Card>
          <Skeleton className="h-9 w-full mb-6 rounded-lg" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-48 mb-1.5" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4 mt-2">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
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
              {profile.role
                ? `${LEARNER_ROLES.find((r) => r.id === profile.role)?.label} Path`
                : 'Personalized for you'}
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-3">
            Your Learning Path
          </h1>
          <p className="text-muted-foreground max-w-lg">
            {profile.role && roleSubtitles[profile.role]
              ? roleSubtitles[profile.role]
              : 'Based on your assessment, here\'s a curated sequence of modules ordered by what you need most.'}
            {' '}Adjust your focus to reorder the path.
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
            {getFocusAreas(profile.role).map((area) => (
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
            {getFocusAreas(profile.role).find((a) => a.id === focusArea)?.description}
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
