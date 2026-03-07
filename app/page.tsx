'use client';

import Link from 'next/link';
import { useLearner } from '@/contexts/LearnerContext';
import {
  Sparkles,
  Brain,
  Route,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Brain,
    title: 'Adaptive Assessment',
    description:
      'A conversational AI assessment that evaluates what you actually know — not multiple choice guessing.',
  },
  {
    icon: Route,
    title: 'Personalized Path',
    description:
      'Your learning path is generated based on your skills, role, and goals. No one-size-fits-all curriculum.',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Feedback',
    description:
      'Write real prompts, build real things, and get specific feedback from Claude on your work.',
  },
  {
    icon: BarChart3,
    title: 'Skills Tracking',
    description:
      'See your competency grow across dimensions as you complete modules and exercises.',
  },
];

export default function Home() {
  const { profile, isLoaded } = useLearner();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Claude Learn</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoaded && profile.assessmentComplete && (
              <>
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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-primary/60" />
            <span className="text-sm font-medium text-primary">AI-Native Learning</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
            Learn Claude the way
            <br />
            <span className="text-primary">Claude would teach you</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
            An adaptive learning platform that assesses what you know, builds a
            personalized path, and gives you real-time feedback as you learn — powered
            by Claude.
          </p>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-6 stagger-children">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border/60 bg-card hover:border-border transition-colors"
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

      {/* What You'll Learn */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/50">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          What you&apos;ll learn
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg">
          Real skills across the full Claude ecosystem — from prompting to production.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Claude Fundamentals',
              topics: ['Mental models for AI', 'Prompt engineering', 'Strengths & limitations'],
            },
            {
              title: 'Building with the API',
              topics: ['Messages API', 'Structured output', 'Multi-turn conversations'],
            },
            {
              title: 'Tool Use & Agents',
              topics: ['Function calling', 'Agentic workflows', 'Tool design patterns'],
            },
          ].map((track) => (
            <div key={track.title} className="p-5 rounded-lg bg-muted/50">
              <h3 className="font-medium text-foreground text-sm mb-3">
                {track.title}
              </h3>
              <ul className="space-y-1.5">
                {track.topics.map((topic) => (
                  <li
                    key={topic}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Claude Learn</span>
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
