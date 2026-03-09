'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLearner } from '@/contexts/LearnerContext';
import { Navigation } from '@/components/Navigation';
import { SkillsRadar } from '@/components/dashboard/SkillsRadar';
import { ShareDialog } from '@/components/dashboard/ShareDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SkillDimension,
  SkillLevel,
  ROLE_SKILL_DIMENSIONS,
  ALL_SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
} from '@/lib/types';
import { moduleMap } from '@/lib/modules';
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Target,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Share2,
  Plus,
  X,
  CalendarClock,
  Goal,
  Minus,
  Equal,
} from 'lucide-react';

const SKILL_LEVEL_ORDER: SkillLevel[] = ['foundations', 'practitioner', 'advanced'];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function levelLabel(level: SkillLevel): string {
  if (!level) return '';
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    isLoaded,
    reset,
    retakeAssessment,
    addLearningGoal,
    removeLearningGoal,
    completeReview,
    flushSession,
  } = useLearner();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [goalDimension, setGoalDimension] = useState<SkillDimension>('prompt-engineering');
  const [goalLevel, setGoalLevel] = useState<SkillLevel>('practitioner');

  // Flush session time on mount so minutes are up to date
  useEffect(() => {
    if (isLoaded) {
      flushSession();
    }
  }, [isLoaded, flushSession]);

  useEffect(() => {
    if (isLoaded && !profile.assessmentComplete) {
      router.push('/assess');
    }
  }, [isLoaded, profile, router]);

  if (!isLoaded || !profile.assessmentComplete) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-12" />
              </Card>
            ))}
          </div>
          <Card className="p-6 mb-8">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
              <div className="lg:col-span-2 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-24 mb-1.5" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <Skeleton className="h-5 w-36 mb-3" />
              <Skeleton className="h-16 w-full rounded-md" />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-5 w-36 mb-3" />
              <Skeleton className="h-16 w-full rounded-md" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const totalModules = profile.learningPath.length || Object.keys(moduleMap).length;
  const completedModules = profile.completedModules.filter(
    (id) => profile.learningPath.length === 0 || profile.learningPath.includes(id)
  ).length;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Use role-specific dimensions
  const activeDimensions = profile.role
    ? ROLE_SKILL_DIMENSIONS[profile.role].map((d) => d.id)
    : [];
  const activeDims = profile.role
    ? ROLE_SKILL_DIMENSIONS[profile.role]
    : [];

  // Find next recommended module
  const nextModuleId = profile.learningPath?.find(
    (id) => !profile.completedModules.includes(id)
  );
  const nextModule = nextModuleId ? moduleMap[nextModuleId] : null;

  // Recently completed
  const recentlyCompleted = profile.completedModules
    .slice(-3)
    .reverse()
    .map((id) => moduleMap[id])
    .filter(Boolean);

  // Reviews
  const today = new Date().toISOString().split('T')[0];
  const dueReviews = profile.reviews.filter((r) => r.nextReviewDate <= today);
  const upcomingReviews = profile.reviews
    .filter((r) => r.nextReviewDate > today)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));

  // Skill comparison helpers
  const hasInitialSkills = profile.initialSkills !== null;
  const skillChanged = (dim: SkillDimension): 'up' | 'down' | 'same' => {
    if (!profile.initialSkills) return 'same';
    const initial = SKILL_LEVEL_VALUES[profile.initialSkills[dim]];
    const current = SKILL_LEVEL_VALUES[profile.skills[dim]];
    if (current > initial) return 'up';
    if (current < initial) return 'down';
    return 'same';
  };

  const handleAddGoal = () => {
    addLearningGoal({
      skillDimension: goalDimension,
      targetLevel: goalLevel,
      createdAt: Date.now(),
    });
    setShowGoalForm(false);
  };

  const handleRetakeAssessment = () => {
    retakeAssessment();
    router.push('/assess');
  };

  const handleCompleteReview = (moduleId: string) => {
    completeReview(moduleId);
    router.push(`/learn/${moduleId}`);
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Skills Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track your progress and see how your skills are growing.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="gap-1.5 shrink-0"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetakeDialogOpen(true)}
              className="gap-1.5 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Retake Assessment</span>
              <span className="sm:hidden">Retake</span>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold text-foreground">
              {completedModules}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Modules Completed
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold text-foreground flex items-center justify-center gap-1">
              {profile.streakDays}
              <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold text-foreground">
              {formatMinutes(profile.totalMinutesLearned)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Minutes Learned
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold text-foreground">
              {Math.round(overallProgress)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Path Progress
            </div>
          </Card>
        </div>

        {/* Skills radar + Skills breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Skills radar chart */}
          <div className="md:col-span-3">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Skills Profile
              </h2>
              <SkillsRadar skills={profile.skills} initialSkills={profile.initialSkills} dimensions={activeDimensions} />

              {/* Before / After comparison */}
              {hasInitialSkills && (
                <div className="mt-6 pt-5 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Before / After Comparison
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_74px_20px_74px] sm:grid-cols-[1fr_80px_24px_80px] gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-1 px-1">
                      <span>Skill</span>
                      <span className="text-center">Initial</span>
                      <span />
                      <span className="text-center">Current</span>
                    </div>
                    {activeDims.map((dim) => {
                      const initial = profile.initialSkills![dim.id] ?? profile.skills[dim.id];
                      const current = profile.skills[dim.id];
                      const change = initial === current ? 'same' as const : skillChanged(dim.id);
                      return (
                        <div
                          key={dim.id}
                          className="grid grid-cols-[1fr_74px_20px_74px] sm:grid-cols-[1fr_80px_24px_80px] gap-1.5 sm:gap-2 items-center px-1 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-xs sm:text-sm text-foreground truncate">{dim.shortLabel}</span>
                          <span className="text-xs text-muted-foreground text-center capitalize">
                            {levelLabel(initial)}
                          </span>
                          <span className="flex justify-center">
                            {change === 'up' && (
                              <ArrowUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            )}
                            {change === 'down' && (
                              <Minus className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {change === 'same' && (
                              <Equal className="h-3.5 w-3.5 text-muted-foreground/50" />
                            )}
                          </span>
                          <span
                            className={`text-xs text-center capitalize ${
                              change === 'up'
                                ? 'text-green-600 dark:text-green-400 font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {levelLabel(current)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Skills breakdown */}
          <div className="md:col-span-2">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Skill Levels
              </h2>
              <div className="space-y-4">
                {activeDims.map((dim) => {
                  const level = profile.skills[dim.id];
                  const value = SKILL_LEVEL_VALUES[level];
                  const percent = (value / 3) * 100;
                  return (
                    <div key={dim.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-foreground">{dim.label}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {level}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Learning Goals */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Goal className="h-4 w-4 text-primary" />
              Learning Goals
            </h2>
            {!showGoalForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalForm(true)}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Goal
              </Button>
            )}
          </div>

          {/* Goal form */}
          {showGoalForm && (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="goal-dimension" className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Skill Dimension
                </label>
                <select
                  id="goal-dimension"
                  value={goalDimension}
                  onChange={(e) => setGoalDimension(e.target.value as SkillDimension)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {activeDims.map((dim) => (
                    <option key={dim.id} value={dim.id}>
                      {dim.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="goal-level" className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Target Level
                </label>
                <select
                  id="goal-level"
                  value={goalLevel}
                  onChange={(e) => setGoalLevel(e.target.value as SkillLevel)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SKILL_LEVEL_ORDER.map((level) => (
                    <option key={level} value={level}>
                      {levelLabel(level)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddGoal}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGoalForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Goals list */}
          {profile.learningGoals.length > 0 ? (
            <div className="space-y-3">
              {profile.learningGoals.map((goal) => {
                const dim = ALL_SKILL_DIMENSIONS.find((d) => d.id === goal.skillDimension);
                const currentLevel = profile.skills[goal.skillDimension];
                const currentValue = SKILL_LEVEL_VALUES[currentLevel];
                const targetValue = SKILL_LEVEL_VALUES[goal.targetLevel];
                const isReached = currentValue >= targetValue;
                const progressPercent = Math.min(
                  (currentValue / targetValue) * 100,
                  100
                );

                return (
                  <div
                    key={goal.skillDimension}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {dim?.label}
                        </span>
                        {isReached && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-[10px] px-1.5 py-0"
                          >
                            Reached
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="capitalize">{levelLabel(currentLevel)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="capitalize">{levelLabel(goal.targetLevel)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isReached ? 'bg-green-500' : 'bg-primary'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLearningGoal(goal.skillDimension)}
                      className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No learning goals set. Add a goal to track your progress toward specific skill levels.
            </p>
          )}
        </Card>

        {/* Spaced Repetition Reviews */}
        {(dueReviews.length > 0 || upcomingReviews.length > 0) && (
          <Card className="p-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Spaced Repetition Reviews
            </h2>

            {/* Due reviews */}
            {dueReviews.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Due Now
                </h3>
                <div className="space-y-2">
                  {dueReviews.map((review) => {
                    const mod = moduleMap[review.moduleId];
                    if (!mod) return null;
                    return (
                      <div
                        key={review.moduleId}
                        className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {mod.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Review #{review.reviewCount + 1}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteReview(review.moduleId)}
                          className="gap-1.5"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming reviews */}
            {upcomingReviews.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {upcomingReviews.map((review) => {
                    const mod = moduleMap[review.moduleId];
                    if (!mod) return null;
                    const reviewDate = new Date(review.nextReviewDate);
                    const formatted = reviewDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <div
                        key={review.moduleId}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {mod.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Review #{review.reviewCount + 1}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Path progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Learning Path Progress
            </h2>
            <span className="text-xs text-muted-foreground">
              {completedModules}/{totalModules} modules
            </span>
          </div>
          <Progress value={overallProgress} className="h-2 mb-4" />
          <div className="flex gap-2 flex-wrap">
            {profile.learningPath.map((id) => {
              const mod = moduleMap[id];
              if (!mod) return null;
              const isDone = profile.completedModules.includes(id);
              return (
                <Link href={`/learn/${id}`} key={id}>
                  <Badge
                    variant={isDone ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      isDone
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {mod.title}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Recommended next + Recently completed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recommended next */}
          {nextModule && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommended Next
              </h2>
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">{nextModule.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {nextModule.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {nextModule.estimatedMinutes} min
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {nextModule.trackTitle}
                  </Badge>
                </div>
              </div>
              <Link href={`/learn/${nextModule.id}`}>
                <Button className="w-full gap-2">
                  Start Module
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Recently completed */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Recently Completed
            </h2>
            {recentlyCompleted.length > 0 ? (
              <div className="space-y-3">
                {recentlyCompleted.map((mod) => (
                  <Link
                    href={`/learn/${mod.id}`}
                    key={mod.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {mod.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mod.trackTitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete your first module to see it here.
              </p>
            )}
          </Card>
        </div>

        {/* Reset */}
        <div className="mt-12 pt-6 border-t border-border flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="text-muted-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Progress
          </Button>
        </div>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        skills={profile.skills}
        completedModules={completedModules}
        totalModules={totalModules}
        streakDays={profile.streakDays}
        totalMinutesLearned={profile.totalMinutesLearned}
        role={profile.role}
        dimensions={activeDimensions}
      />

      <ConfirmDialog
        open={retakeDialogOpen}
        onOpenChange={setRetakeDialogOpen}
        title="Retake Assessment"
        description="Your current skill levels will be re-evaluated, but module progress will be kept."
        confirmLabel="Retake"
        onConfirm={handleRetakeAssessment}
      />

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset All Progress"
        description="This will erase all your progress, skills, and completed modules. This cannot be undone."
        confirmLabel="Reset Everything"
        onConfirm={() => { router.push('/'); setTimeout(() => reset(), 100); }}
        variant="destructive"
      />
    </div>
  );
}
