'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLearner } from '@/contexts/LearnerContext';
import { Navigation } from '@/components/Navigation';
import { SkillsRadar } from '@/components/dashboard/SkillsRadar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Module,
  SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
} from '@/lib/types';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Target,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

import howClaudeThinks from '@/content/modules/how-claude-thinks.json';
import promptEngineering from '@/content/modules/prompt-engineering.json';
import firstApiCall from '@/content/modules/first-api-call.json';
import structuredOutput from '@/content/modules/structured-output.json';
import toolUseIntro from '@/content/modules/tool-use-intro.json';

const moduleMap: Record<string, Module> = {
  'how-claude-thinks': howClaudeThinks as Module,
  'prompt-engineering': promptEngineering as Module,
  'first-api-call': firstApiCall as Module,
  'structured-output': structuredOutput as Module,
  'tool-use-intro': toolUseIntro as Module,
};

export default function DashboardPage() {
  const router = useRouter();
  const { profile, isLoaded, reset } = useLearner();

  useEffect(() => {
    if (isLoaded && !profile.assessmentComplete) {
      router.push('/assess');
    }
  }, [isLoaded, profile, router]);

  if (!isLoaded || !profile.assessmentComplete) return null;

  const totalModules = Object.keys(moduleMap).length;
  const completedModules = profile.completedModules.length;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Find next recommended module
  const nextModuleId = profile.learningPath.find(
    (id) => !profile.completedModules.includes(id)
  );
  const nextModule = nextModuleId ? moduleMap[nextModuleId] : null;

  // Recently completed
  const recentlyCompleted = profile.completedModules
    .slice(-3)
    .reverse()
    .map((id) => moduleMap[id])
    .filter(Boolean);

  // Calculate total learning time
  const totalMinutes = profile.completedModules.reduce((acc, id) => {
    const mod = moduleMap[id];
    return acc + (mod?.estimatedMinutes || 0);
  }, 0);

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Skills Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your progress and see how your skills are growing.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold text-foreground">
              {totalMinutes}
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

        <div className="grid grid-cols-5 gap-8 mb-10">
          {/* Skills radar chart */}
          <div className="col-span-3">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Skills Profile
              </h2>
              <SkillsRadar skills={profile.skills} />
            </Card>
          </div>

          {/* Skills breakdown */}
          <div className="col-span-2">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Skill Levels
              </h2>
              <div className="space-y-4">
                {SKILL_DIMENSIONS.map((dim) => {
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

        <div className="grid grid-cols-2 gap-8">
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
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) {
                reset();
                router.push('/');
              }
            }}
            className="text-muted-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Progress
          </Button>
        </div>
      </div>
    </div>
  );
}
