'use client';

import Link from 'next/link';
import { useLearner } from '@/contexts/LearnerContext';
import { Skeleton } from '@/components/ui/skeleton';
import { LEARNER_ROLES, ROLE_SKILL_DIMENSIONS, ALL_SKILL_DIMENSIONS } from '@/lib/types';
import { moduleMap, getModulesByRole } from '@/lib/modules';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sparkles,
  Brain,
  Route,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Zap,
  Compass,
  Code2,
  Palette,
  Briefcase,
  Terminal,
  BookOpen,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

// Map icon strings from LEARNER_ROLES to actual Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Code2,
  BarChart3,
  Palette,
  Briefcase,
};

const features = [
  {
    icon: Brain,
    title: 'Adaptive Assessment',
    description:
      'A natural conversation with Claude reveals what you know — no multiple choice, no guessing.',
  },
  {
    icon: Route,
    title: 'Personalized Path',
    description:
      'Your curriculum adapts to your role, experience, and skill gaps. No one-size-fits-all.',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Feedback',
    description:
      'Write real prompts, design real schemas, then get specific, streaming feedback from Claude.',
  },
  {
    icon: Sparkles,
    title: 'AI Learning Companion',
    description:
      'A context-aware sidebar assistant that knows your module, section, and skill profile.',
  },
  {
    icon: Terminal,
    title: 'Live Prompt Playground',
    description:
      'Test prompts against the Claude API directly within module pages with streaming responses.',
  },
  {
    icon: BarChart3,
    title: 'Skills Radar',
    description:
      'Track growth across 5 role-specific dimensions with animated before/after comparison.',
  },
];

const steps = [
  {
    num: 1,
    icon: Compass,
    title: 'Choose Your Role',
    description:
      'Developer, PM, designer, business professional, or just getting started — pick the path that fits.',
  },
  {
    num: 2,
    icon: MessageSquare,
    title: 'Have a Conversation',
    description:
      'Claude assesses what you already know through natural dialogue — not a quiz.',
  },
  {
    num: 3,
    icon: Route,
    title: 'Get Your Path',
    description:
      'Receive a personalized curriculum across your role\'s 5 skill dimensions.',
  },
];

const difficultyTiers = [
  {
    level: 'Beginner',
    description: 'Build intuition for how Claude thinks and write your first prompts.',
  },
  {
    level: 'Intermediate',
    description: 'Apply Claude to real work with structured techniques and feedback loops.',
  },
  {
    level: 'Advanced',
    description: 'Evaluate results, manage risk, and scale Claude across your workflow.',
  },
];

const roleTaglines: Record<string, string> = {
  'getting-started': 'Build a foundation in AI — understand what it can do, how to use it responsibly, and where to go next.',
  developer: 'Ship AI-powered software — from your first API call to production deployment with tools, evals, and Claude Code.',
  'product-manager': 'Lead AI product strategy — evaluate opportunities, define metrics, communicate value, and manage governance.',
  designer: 'Design AI-native experiences — conversational UI, research synthesis, prototyping, and design system integration.',
  business: 'Transform your workflows — automate processes, measure ROI, create AI-powered reports, and manage compliance.',
};

export default function Home() {
  const { profile, isLoaded } = useLearner();

  const totalModules = Object.keys(moduleMap).length;
  const totalPaths = LEARNER_ROLES.length;
  const totalDimensions = ALL_SKILL_DIMENSIONS.length;

  return (
    <div className="min-h-screen">
      {/* ─── Nav ─── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Claude Learn</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="#paths"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Paths
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              How It Works
            </a>
            <a
              href="#curriculum"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Curriculum
            </a>
            {isLoaded && profile.assessmentComplete && (
              <>
                <div className="hidden sm:block w-px h-4 bg-border mx-1" />
                <Link
                  href="/path"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  My Path
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Dashboard
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 overflow-hidden">
        {/* Decorative radar silhouette */}
        <div className="absolute top-8 right-0 w-80 h-80 opacity-[0.04] animate-radar-pulse pointer-events-none hidden md:block">
          <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
            <polygon
              points="100,20 170,60 170,140 100,180 30,140 30,60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <polygon
              points="100,50 145,75 145,125 100,150 55,125 55,75"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <polygon
              points="100,75 125,87 125,112 100,125 75,112 75,87"
              fill="currentColor"
              opacity="0.3"
            />
            <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="0.5" />
            <line x1="30" y1="60" x2="170" y2="140" stroke="currentColor" strokeWidth="0.5" />
            <line x1="170" y1="60" x2="30" y2="140" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-primary/60" />
            <span className="text-sm font-medium text-primary">AI-Native Learning Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
            Master Claude
            <br />
            <span className="text-primary">at your level, for your role</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            An adaptive platform that assesses what you know through conversation, builds a
            personalized curriculum, and gives you real-time feedback — all powered by Claude.
          </p>

          {/* Micro-stats */}
          <div className="flex items-center gap-4 sm:gap-6 mb-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{totalPaths}</span> learning paths
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{totalModules}</span> modules
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{totalDimensions}</span> skill dimensions
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            {!isLoaded ? (
              <Skeleton className="h-12 w-52 rounded-md" />
            ) : (
              <>
                <Link href={profile.assessmentComplete ? '/path' : '/assess'}>
                  <Button size="lg" className="gap-2 text-base px-6 h-12">
                    {profile.assessmentComplete ? (
                      <>
                        Continue Learning
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Start Your Assessment
                        <Zap className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
                {!profile.assessmentComplete && (
                  <span className="text-sm text-muted-foreground">Takes ~3 minutes</span>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Role Paths Showcase ─── */}
      <section id="paths" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/50">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            {totalPaths} paths. One platform.
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Every role gets its own curriculum, skill dimensions, and tailored assessment.
            Pick the path that fits — the platform adapts to you.
          </p>
        </div>

        <Tabs defaultValue={LEARNER_ROLES[0].id} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {LEARNER_ROLES.map((role) => {
              const Icon = iconMap[role.icon];
              return (
                <TabsTrigger
                  key={role.id}
                  value={role.id}
                  className="flex-1 min-w-[120px] gap-1.5 py-2 text-xs sm:text-sm"
                >
                  {Icon && <Icon className="h-4 w-4 hidden sm:block" />}
                  {role.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEARNER_ROLES.map((role) => {
            const dims = ROLE_SKILL_DIMENSIONS[role.id];
            const moduleCount = getModulesByRole(role.id).length;
            const Icon = iconMap[role.icon];

            return (
              <TabsContent key={role.id} value={role.id} className="mt-6">
                <div className="rounded-xl border border-border/60 bg-card p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {Icon && <Icon className="h-6 w-6 text-primary" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {role.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                        {roleTaglines[role.id]}
                      </p>
                    </div>
                  </div>

                  {/* Skill dimensions */}
                  <div className="mb-6">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                      5 Skill Dimensions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dims.map((dim) => (
                        <span
                          key={dim.id}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/15"
                        >
                          {dim.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Module count + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        <span className="font-semibold text-foreground">{moduleCount}</span> modules
                      </span>
                    </div>
                    <Link href={`/assess?role=${role.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Start as {role.label}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/50">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            Three minutes to your personalized path
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No signup forms. No configuration wizards. Just a conversation.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 relative">
          {/* Connecting lines (desktop only) */}
          <div className="hidden sm:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px border-t-2 border-dashed border-border/60" />

          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <div key={step.num} className="relative text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-muted/60 border border-border/60 mb-5 mx-auto relative">
                  <StepIcon className="h-8 w-8 text-primary" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-border/50">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            Everything is powered by Claude
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Assessment, feedback, exercises, and your learning companion — every interaction
            is a real conversation with Claude, not a static template.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Curriculum Depth ─── */}
      <section id="curriculum" className="max-w-5xl mx-auto px-6 py-20 border-t border-border/50">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
          {totalModules} modules. Real depth.
        </h2>
        <p className="text-muted-foreground max-w-lg mb-8">
          From first prompts to advanced workflows — ~8+ hours of hands-on,
          exercise-driven content with real-time AI feedback.
        </p>

        <div className="grid sm:grid-cols-3 gap-5">
          {difficultyTiers.map((tier) => (
            <div
              key={tier.level}
              className="p-5 rounded-xl border border-border/60 bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{tier.level}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-border/50">
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
            Start learning in 3 minutes
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            A short conversation with Claude, then a personalized learning path
            built around your role and skill level.
          </p>
          {!isLoaded ? (
            <Skeleton className="h-12 w-52 rounded-md mx-auto" />
          ) : (
            <Link href={profile.assessmentComplete ? '/path' : '/assess'}>
              <Button size="lg" className="gap-2 text-base px-8 h-12">
                {profile.assessmentComplete ? (
                  <>
                    Continue Learning
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Start Your Assessment
                    <Zap className="h-4 w-4" />
                  </>
                )}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Claude Learn</span>
            </div>
            <span className="text-xs text-muted-foreground/60">Powered by Claude</span>
          </div>
          <a
            href="https://www.linkedin.com/in/jeremyalexanderjones/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Built by Jeremy Jones
          </a>
        </div>
      </footer>
    </div>
  );
}
