'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLearner } from '@/contexts/LearnerContext';
import { Navigation } from '@/components/Navigation';
import { CompanionPanel } from '@/components/learning/CompanionPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Module, ModuleSection, ExerciseFeedback } from '@/lib/types';
import { streamChat } from '@/lib/claude';
import {
  CheckCircle2,
  Circle,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

// Import all modules
import howClaudeThinks from '@/content/modules/how-claude-thinks.json';
import promptEngineering from '@/content/modules/prompt-engineering.json';
import firstApiCall from '@/content/modules/first-api-call.json';
import structuredOutput from '@/content/modules/structured-output.json';
import toolUseIntro from '@/content/modules/tool-use-intro.json';
import evaluatorOptimizer from '@/content/modules/evaluator-optimizer.json';
import claudeCodeIntro from '@/content/modules/claude-code-intro.json';
import buildingEvals from '@/content/modules/building-evals.json';

const moduleMap: Record<string, Module> = {
  'how-claude-thinks': howClaudeThinks as Module,
  'prompt-engineering': promptEngineering as Module,
  'first-api-call': firstApiCall as Module,
  'structured-output': structuredOutput as Module,
  'tool-use-intro': toolUseIntro as Module,
  'evaluator-optimizer': evaluatorOptimizer as Module,
  'claude-code-intro': claudeCodeIntro as Module,
  'building-evals': buildingEvals as Module,
};

const allModuleIds = [
  'how-claude-thinks',
  'prompt-engineering',
  'first-api-call',
  'structured-output',
  'tool-use-intro',
  'evaluator-optimizer',
  'claude-code-intro',
  'building-evals',
];

function SectionContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n');

  return (
    <div className="prose-module">
      {paragraphs.map((para, i) => {
        if (para.startsWith('```')) {
          const lines = para.split('\n');
          const code = lines.slice(1, -1).join('\n');
          return (
            <pre key={i} className="bg-muted/80 rounded-lg p-4 mb-4 overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          );
        }

        if (para.includes('```')) {
          const parts = para.split(/```[\w]*\n/);
          return (
            <div key={i}>
              {parts.map((part, j) => {
                if (part.includes('```')) {
                  const code = part.replace('```', '');
                  return (
                    <pre key={j} className="bg-muted/80 rounded-lg p-4 mb-4 overflow-x-auto">
                      <code className="text-sm font-mono">{code}</code>
                    </pre>
                  );
                }
                return (
                  <p
                    key={j}
                    className="mb-4 leading-7 text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: part
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'),
                    }}
                  />
                );
              })}
            </div>
          );
        }

        if (para.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-semibold mt-8 mb-3 text-foreground">
              {para.replace('## ', '')}
            </h2>
          );
        }
        if (para.startsWith('### ')) {
          return (
            <h3 key={i} className="text-lg font-medium mt-6 mb-2 text-foreground">
              {para.replace('### ', '')}
            </h3>
          );
        }

        if (para.match(/^[-\d]/m)) {
          const items = para.split('\n').filter((l) => l.trim());
          return (
            <ul key={i} className="mb-4 ml-6 space-y-1.5 list-disc text-muted-foreground">
              {items.map((item, j) => (
                <li
                  key={j}
                  className="leading-7"
                  dangerouslySetInnerHTML={{
                    __html: item
                      .replace(/^[-*]\s*/, '')
                      .replace(/^\d+\.\s*/, '')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'),
                  }}
                />
              ))}
            </ul>
          );
        }

        return (
          <p
            key={i}
            className="mb-4 leading-7 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: para
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'),
            }}
          />
        );
      })}
    </div>
  );
}

function ExerciseBlock({
  section,
  moduleData,
  onComplete,
}: {
  section: ModuleSection;
  moduleData: Module;
  onComplete: (sectionId: string, response: string) => void;
}) {
  const { profile, saveExerciseFeedback } = useLearner();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const previousAttempts = profile.moduleProgress[moduleData.id]?.exerciseFeedback?.[section.id] || [];

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;
    setIsSubmitting(true);
    let accumulated = '';

    await streamChat(
      {
        messages: [{ role: 'user', content: input.trim() }],
        mode: 'feedback',
        context: {
          role: profile.role || undefined,
          moduleTitle: moduleData.title,
          sectionTitle: section.title,
          sectionContent: section.content?.slice(0, 500),
          exercisePrompt: section.exercise?.prompt,
          evaluationCriteria: section.exercise?.evaluationCriteria,
        },
      },
      (text) => {
        accumulated += text;
        setFeedback(accumulated);
      },
      () => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        onComplete(section.id, input.trim());
        saveExerciseFeedback(moduleData.id, section.id, {
          response: input.trim(),
          feedback: accumulated,
          timestamp: Date.now(),
          attemptNumber,
        });
      },
      () => {
        setFeedback('Unable to get feedback right now. Your response has been saved.');
        setIsSubmitting(false);
        setIsSubmitted(true);
        onComplete(section.id, input.trim());
      }
    );
  };

  return (
    <Card className="p-6 border-primary/20 bg-primary/[0.02]">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {section.type === 'exercise' ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <Lightbulb className="h-4 w-4 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
          <p className="text-xs text-muted-foreground">
            {section.type === 'exercise' ? 'Interactive Exercise' : 'Check Understanding'}
          </p>
        </div>
      </div>

      {section.content && <SectionContent content={section.content} />}

      {section.exercise && (
        <>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <SectionContent content={section.exercise.prompt} />
          </div>

          {section.exercise.hints && section.exercise.hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-1 text-sm text-primary mb-4 hover:underline"
            >
              {showHints ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showHints ? 'Hide hints' : 'Show hints'}
            </button>
          )}

          {showHints && section.exercise.hints && (
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <ul className="space-y-2">
                {section.exercise.hints.map((hint, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {previousAttempts.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {previousAttempts.length} previous attempt{previousAttempts.length > 1 ? 's' : ''}
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2">
                  {previousAttempts.map((attempt, i) => (
                    <div key={i} className="text-xs p-3 rounded bg-muted/50 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">Attempt {attempt.attemptNumber}</span>
                        <span className="text-muted-foreground">
                          {new Date(attempt.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{attempt.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your response here..."
            disabled={isSubmitted}
            className="w-full min-h-[120px] resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-60 mb-3"
          />

          {!isSubmitted && (
            <Button onClick={handleSubmit} disabled={!input.trim() || isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting feedback...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit for Feedback
                </>
              )}
            </Button>
          )}

          {feedback && (
            <div className="mt-4 p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Claude&apos;s Feedback</span>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {feedback}
              </div>
            </div>
          )}

          {isSubmitted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInput('');
                setFeedback('');
                setIsSubmitted(false);
                setAttemptNumber(prev => prev + 1);
              }}
              className="mt-3 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Try Again
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

export default function ModulePage() {
  const params = useParams();
  const { profile, updateModuleProgress, completeModule, saveExerciseFeedback } = useLearner();
  const [showCompanion, setShowCompanion] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [currentSectionTitle, setCurrentSectionTitle] = useState<string | undefined>();
  const [currentSectionContent, setCurrentSectionContent] = useState<string | undefined>();

  const moduleId = params.moduleId as string;
  const moduleData = moduleMap[moduleId];

  useEffect(() => {
    if (moduleData) {
      updateModuleProgress(moduleId, { started: true });
    }
  }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const progress = profile.moduleProgress[moduleId];
    if (progress?.completedSections) {
      setCompletedSections(new Set(progress.completedSections));
    }
  }, [profile.moduleProgress, moduleId]);

  useEffect(() => {
    if (!moduleData) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace('section-', '');
            const section = moduleData.sections.find((s) => s.id === sectionId);
            if (section) {
              setCurrentSectionTitle(section.title);
              setCurrentSectionContent(section.content?.slice(0, 500));
            }
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    const elements = document.querySelectorAll('[id^="section-"]');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [moduleData]);

  if (!moduleData) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Module not found</h1>
          <Link href="/path">
            <Button variant="outline">Back to Learning Path</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModuleIndex = allModuleIds.indexOf(moduleId);
  const nextModuleId =
    currentModuleIndex < allModuleIds.length - 1 ? allModuleIds[currentModuleIndex + 1] : null;
  const prevModuleId = currentModuleIndex > 0 ? allModuleIds[currentModuleIndex - 1] : null;

  const isCompleted = profile.completedModules.includes(moduleId);
  const progressPercent =
    moduleData.sections.length > 0
      ? (completedSections.size / moduleData.sections.length) * 100
      : 0;

  const handleSectionComplete = (sectionId: string, response?: string) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionId);
    setCompletedSections(newCompleted);

    const exerciseResponses = response
      ? { ...profile.moduleProgress[moduleId]?.exerciseResponses, [sectionId]: response }
      : profile.moduleProgress[moduleId]?.exerciseResponses || {};

    updateModuleProgress(moduleId, {
      completedSections: Array.from(newCompleted),
      exerciseResponses,
    });

    if (newCompleted.size === moduleData.sections.length) {
      completeModule(moduleId, moduleData.skillDimension);
    }
  };

  const markConceptComplete = (sectionId: string) => {
    handleSectionComplete(sectionId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1 flex">
        {/* Left sidebar — module outline */}
        <aside className="w-56 shrink-0 border-r border-border bg-card/50 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto hidden lg:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Module Outline
            </h3>
            <div className="space-y-0.5">
              {moduleData.sections.map((section) => {
                const isDone = completedSections.has(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      const el = document.getElementById(`section-${section.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full flex items-start gap-2 px-2 py-1.5 rounded text-left hover:bg-muted/50 transition-colors group"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs leading-tight ${
                        isDone
                          ? 'text-muted-foreground'
                          : 'text-foreground/80 group-hover:text-foreground'
                      }`}
                    >
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Progress in sidebar */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">
                  {completedSections.size}/{moduleData.sections.length}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1" />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Module header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {moduleData.trackTitle}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    moduleData.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-700'
                      : moduleData.difficulty === 'intermediate'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {moduleData.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {moduleData.estimatedMinutes} min
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                {moduleData.title}
              </h1>
              <p className="text-muted-foreground">{moduleData.description}</p>

              {/* Progress (visible on mobile where sidebar is hidden) */}
              <div className="mt-4 flex items-center gap-3 lg:hidden">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {completedSections.size}/{moduleData.sections.length} sections
                </span>
              </div>

              {/* Learning objectives */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Learning Objectives
                </h3>
                <ul className="space-y-1">
                  {moduleData.learningObjectives.map((obj, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {moduleData.sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
                  {section.type === 'concept' && (
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {section.title}
                      </h2>
                      <SectionContent content={section.content} />
                      {!completedSections.has(section.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markConceptComplete(section.id)}
                          className="mt-4 gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark as read
                        </Button>
                      )}
                      {completedSections.has(section.id) && (
                        <div className="flex items-center gap-1 mt-4 text-sm text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed
                        </div>
                      )}
                    </div>
                  )}

                  {section.type === 'takeaway' && (
                    <Card className="p-5 bg-primary/5 border-primary/20">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1 text-sm">Key Takeaway</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      </div>
                      {!completedSections.has(section.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markConceptComplete(section.id)}
                          className="mt-3 ml-8 gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Got it
                        </Button>
                      )}
                    </Card>
                  )}

                  {(section.type === 'exercise' || section.type === 'check') && (
                    <ExerciseBlock
                      section={section}
                      moduleData={moduleData}
                      onComplete={handleSectionComplete}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Module completion & navigation */}
            <div className="mt-12 pt-8 border-t border-border">
              {isCompleted && (
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Module completed!</span>
                </div>
              )}
              <div className="flex justify-between">
                {prevModuleId ? (
                  <Link href={`/learn/${prevModuleId}`}>
                    <Button variant="outline" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Previous Module
                    </Button>
                  </Link>
                ) : (
                  <Link href="/path">
                    <Button variant="outline" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Path
                    </Button>
                  </Link>
                )}
                {nextModuleId ? (
                  <Link href={`/learn/${nextModuleId}`}>
                    <Button className="gap-2">
                      Next Module
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button className="gap-2">
                      View Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Companion toggle button */}
        <button
          onClick={() => setShowCompanion(!showCompanion)}
          className={`fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-colors z-40 ${
            showCompanion
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
        </button>

        {/* Companion panel — overlay on mobile, sidebar on desktop */}
        {showCompanion && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setShowCompanion(false)}
            />
            <div className="fixed right-0 top-[57px] z-40 lg:relative lg:top-0 lg:z-auto">
              <CompanionPanel
                moduleData={moduleData}
                currentSectionTitle={currentSectionTitle}
                currentSectionContent={currentSectionContent}
                onClose={() => setShowCompanion(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
