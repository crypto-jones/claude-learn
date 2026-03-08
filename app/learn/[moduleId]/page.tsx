'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useLearner } from '@/contexts/LearnerContext';
import { Navigation } from '@/components/Navigation';
import { CompanionPanel } from '@/components/learning/CompanionPanel';
import { PromptPlayground } from '@/components/learning/PromptPlayground';
import { CodeBlock } from '@/components/learning/CodeBlock';
import { AdaptedContent } from '@/components/learning/AdaptedContent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Module, ModuleSection, ExerciseFeedback, ChatMessage, ALL_SKILL_DIMENSIONS } from '@/lib/types';
import { streamChat } from '@/lib/claude';
import { moduleMap, allModuleIds } from '@/lib/modules';
import { injectConceptLinks } from '@/lib/concepts';
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
  Trophy,
  AlertCircle,
  X,
} from 'lucide-react';

function parseContentSegments(content: string): Array<{ type: 'code' | 'text'; content: string; language?: string }> {
  const segments: Array<{ type: 'code' | 'text'; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', content: text });
    }
    segments.push({ type: 'code', content: match[2].replace(/\n$/, ''), language: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: 'text', content: text });
  }

  return segments;
}

function formatInlineText(text: string, moduleId?: string, sectionId?: string): string {
  let result = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  if (moduleId && sectionId) {
    result = injectConceptLinks(result, moduleId, sectionId);
  }
  return result;
}

function SectionContent({ content, moduleId, sectionId }: { content: string; moduleId?: string; sectionId?: string }) {
  const segments = parseContentSegments(content);

  return (
    <div className="prose-module">
      {segments.map((segment, i) => {
        if (segment.type === 'code') {
          return <CodeBlock key={i} code={segment.content} language={segment.language} />;
        }

        const paragraphs = segment.content.split('\n\n');
        return (
          <Fragment key={i}>
            {paragraphs.map((para, j) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={j} className="text-xl font-semibold mt-8 mb-3 text-foreground">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={j} className="text-lg font-medium mt-6 mb-2 text-foreground">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }

              if (trimmed.match(/^\*\*[^*]+\*\*$/)) {
                return (
                  <h3 key={j} className="text-lg font-medium mt-6 mb-2 text-foreground">
                    {trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '')}
                  </h3>
                );
              }

              if (trimmed.match(/^[-*•]\s/m)) {
                const items = trimmed.split(/\n(?=[-*•]\s)/).filter((l) => l.trim());
                return (
                  <ul key={j} className="mb-4 ml-6 space-y-1.5 list-disc text-muted-foreground">
                    {items.map((item, k) => (
                      <li
                        key={k}
                        className="leading-7"
                        dangerouslySetInnerHTML={{
                          __html: formatInlineText(
                            item.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, ''),
                            moduleId,
                            sectionId,
                          ),
                        }}
                      />
                    ))}
                  </ul>
                );
              }

              if (trimmed.match(/^\d+[.)]\s/m)) {
                const items = trimmed.split('\n').filter((l) => l.trim());
                return (
                  <ol key={j} className="mb-4 ml-6 space-y-1.5 list-decimal text-muted-foreground">
                    {items.map((item, k) => (
                      <li
                        key={k}
                        className="leading-7"
                        dangerouslySetInnerHTML={{
                          __html: formatInlineText(
                            item.replace(/^\d+[.)]\s+/, ''),
                            moduleId,
                            sectionId,
                          ),
                        }}
                      />
                    ))}
                  </ol>
                );
              }

              return (
                <p
                  key={j}
                  className="mb-4 leading-7 text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineText(trimmed, moduleId, sectionId),
                  }}
                />
              );
            })}
          </Fragment>
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
  const { profile, saveExerciseFeedback, updateExerciseFeedback } = useLearner();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);
  const [followUpStreamingContent, setFollowUpStreamingContent] = useState('');
  const followUpContainerRef = useRef<HTMLDivElement>(null);
  const followUpInputRef = useRef<HTMLTextAreaElement>(null);
  const previousAttempts = profile.moduleProgress?.[moduleData.id]?.exerciseFeedback?.[section.id] || [];

  const scrollFollowUpToBottom = useCallback(() => {
    const container = followUpContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollFollowUpToBottom();
  }, [conversationMessages, followUpStreamingContent, scrollFollowUpToBottom]);

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
        setConversationMessages([
          { role: 'user', content: input.trim() },
          { role: 'assistant', content: accumulated },
        ]);
      },
      () => {
        setFeedback('Unable to get feedback right now. Your response has been saved.');
        setIsSubmitting(false);
        setIsSubmitted(true);
        onComplete(section.id, input.trim());
      }
    );
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || isFollowUpStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: followUpInput.trim() };
    const newMessages = [...conversationMessages, userMessage];
    setConversationMessages(newMessages);
    setFollowUpInput('');
    setIsFollowUpStreaming(true);

    let accumulated = '';

    await streamChat(
      {
        messages: newMessages,
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
        setFollowUpStreamingContent(accumulated);
      },
      () => {
        const updatedMessages: ChatMessage[] = [...newMessages, { role: 'assistant', content: accumulated }];
        setConversationMessages(updatedMessages);
        setFollowUpStreamingContent('');
        setIsFollowUpStreaming(false);
        updateExerciseFeedback(moduleData.id, section.id, updatedMessages.slice(2));
      },
      () => {
        setConversationMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "I'm having trouble responding right now. Please try again." },
        ]);
        setFollowUpStreamingContent('');
        setIsFollowUpStreaming(false);
      }
    );
  };

  const handleFollowUpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowUp();
    }
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
            aria-label="Write your exercise response"
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

          {isSubmitted && conversationMessages.length >= 2 && (
            <div className="mt-4 border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Continue the conversation</span>
              </div>

              {(conversationMessages.length > 2 || isFollowUpStreaming) && (
                <div
                  ref={followUpContainerRef}
                  className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto"
                >
                  {conversationMessages.slice(2).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isFollowUpStreaming && followUpStreamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-muted text-foreground">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {followUpStreamingContent}
                        </p>
                      </div>
                    </div>
                  )}

                  {isFollowUpStreaming && !followUpStreamingContent && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-3 py-2 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 py-3 border-t border-border bg-background">
                <div className="flex gap-2">
                  <textarea
                    ref={followUpInputRef}
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={handleFollowUpKeyDown}
                    placeholder="Ask a follow-up question or share revised thinking..."
                    aria-label="Ask a follow-up question about the exercise"
                    disabled={isFollowUpStreaming}
                    className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-h-[36px] max-h-[80px]"
                    rows={1}
                  />
                  <Button
                    onClick={handleFollowUp}
                    disabled={!followUpInput.trim() || isFollowUpStreaming}
                    size="icon"
                    className="h-[36px] w-[36px] rounded-lg shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Ask questions, share revised answers, or explore the concept deeper
                </p>
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
                setConversationMessages([]);
                setFollowUpInput('');
                setFollowUpStreamingContent('');
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
  const searchParams = useSearchParams();
  const { profile, isLoaded, updateModuleProgress, completeModule } = useLearner();
  const [showCompanion, setShowCompanion] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [currentSectionTitle, setCurrentSectionTitle] = useState<string | undefined>();
  const [currentSectionContent, setCurrentSectionContent] = useState<string | undefined>();
  const [prereqDismissed, setPrereqDismissed] = useState(false);
  const wasCompletedRef = useRef(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const moduleId = params.moduleId as string;
  const moduleData = moduleMap[moduleId];

  useEffect(() => {
    if (moduleData && isLoaded) {
      updateModuleProgress(moduleId, { started: true });
    }
  }, [moduleId, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const progress = profile.moduleProgress?.[moduleId];
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

  // Scroll to section from ?section= query param (concept connections)
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam && moduleData) {
      const el = document.getElementById(`section-${sectionParam}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
      }
    }
  }, [searchParams, moduleData]);

  // Track completion state for confetti trigger
  const isCompleted = profile.completedModules.includes(moduleId);

  useEffect(() => {
    if (isCompleted && !wasCompletedRef.current) {
      // Module just completed — fire confetti
      setJustCompleted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c2724f', '#e8a87c', '#d4956a', '#f0c9a8'],
      });
      // Second burst slightly delayed for a richer effect
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { y: 0.5, x: 0.3 },
          colors: ['#c2724f', '#e8a87c', '#d4956a', '#f0c9a8'],
        });
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { y: 0.5, x: 0.7 },
          colors: ['#c2724f', '#e8a87c', '#d4956a', '#f0c9a8'],
        });
      }, 300);
    }
    wasCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Compute unmet prerequisites
  const unmetPrereqs = moduleData
    ? moduleData.prerequisites
        .filter((preId) => !profile.completedModules.includes(preId))
        .map((preId) => ({ id: preId, title: moduleMap[preId]?.title || preId }))
    : [];
  const showPrereqBanner = unmetPrereqs.length > 0 && !isCompleted && !prereqDismissed;

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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex">
          <aside className="w-56 shrink-0 border-r border-border bg-card/50 sticky top-[57px] h-[calc(100vh-57px)] hidden lg:block">
            <div className="p-4">
              <Skeleton className="h-3 w-24 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-1.5 w-full mt-6 rounded-full" />
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="mb-8">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <Skeleton className="h-7 w-80 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentModuleIndex = allModuleIds.indexOf(moduleId);
  const nextModuleId =
    currentModuleIndex < allModuleIds.length - 1 ? allModuleIds[currentModuleIndex + 1] : null;
  const prevModuleId = currentModuleIndex > 0 ? allModuleIds[currentModuleIndex - 1] : null;

  const progressPercent =
    moduleData.sections.length > 0
      ? (completedSections.size / moduleData.sections.length) * 100
      : 0;

  const handleSectionComplete = (sectionId: string, response?: string) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionId);
    setCompletedSections(newCompleted);

    const exerciseResponses = response
      ? { ...profile.moduleProgress?.[moduleId]?.exerciseResponses, [sectionId]: response }
      : profile.moduleProgress?.[moduleId]?.exerciseResponses || {};

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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : moduleData.difficulty === 'intermediate'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
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

            {/* Prerequisite soft-gate banner */}
            {showPrereqBanner && (
              <div className="mb-8 animate-fade-in">
                <Card className="p-4 border-amber-300/50 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {unmetPrereqs.length === 1 ? 'Recommended prerequisite:' : 'Recommended prerequisites:'}{' '}
                        {unmetPrereqs.map((prereq, i) => (
                          <Fragment key={prereq.id}>
                            {i > 0 && ', '}
                            <Link
                              href={`/learn/${prereq.id}`}
                              className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                            >
                              {prereq.title}
                            </Link>
                          </Fragment>
                        ))}
                      </p>
                      <p className="text-xs text-amber-700/70 dark:text-amber-400/60 mt-1">
                        You can continue anyway — this is just a suggestion.
                      </p>
                    </div>
                    <button
                      onClick={() => setPrereqDismissed(true)}
                      aria-label="Dismiss prerequisite suggestion"
                      className="text-amber-600/60 hover:text-amber-800 dark:text-amber-400/60 dark:hover:text-amber-300 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              </div>
            )}

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
                      <SectionContent content={section.content} moduleId={moduleId} sectionId={section.id} />
                      {profile.role && (
                        <AdaptedContent
                          sectionContent={section.content}
                          role={profile.role}
                          moduleId={moduleId as string}
                          sectionId={section.id}
                        />
                      )}
                      <div className="flex items-center gap-2 mt-4">
                        {section.playground && (
                          <PromptPlayground section={section} moduleData={moduleData} />
                        )}
                        {!completedSections.has(section.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markConceptComplete(section.id)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark as read
                          </Button>
                        )}
                        {completedSections.has(section.id) && (
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === 'takeaway' && (
                    <Card className="p-5 bg-primary/5 border-primary/20">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1 text-sm">Key Takeaway</h3>
                          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                            {section.content.split('\n\n').map((para, i) => {
                              const trimmed = para.trim();
                              if (!trimmed) return null;
                              if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                                return (
                                  <div key={i} className="flex gap-2">
                                    <span className="shrink-0 mt-0.5">•</span>
                                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed.replace(/^[•\-]\s*/, '')) }} />
                                  </div>
                                );
                              }
                              return <p key={i} dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed) }} />;
                            })}
                          </div>
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
                <Card className={`p-6 mb-6 border-primary/20 bg-primary/[0.04] ${justCompleted ? 'animate-scale-in' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${justCompleted ? 'animate-celebrate-bounce' : ''}`}>
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Module Completed!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your {ALL_SKILL_DIMENSIONS.find((d) => d.id === moduleData.skillDimension)?.label || moduleData.skillDimension} skill leveled up to{' '}
                        <span className="font-medium text-primary">
                          {profile.skills[moduleData.skillDimension] || 'Practitioner'}
                        </span>
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              <div className="flex justify-between gap-3">
                {prevModuleId ? (
                  <Link href={`/learn/${prevModuleId}`}>
                    <Button variant="outline" className="gap-1.5 text-sm">
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Previous Module</span>
                      <span className="sm:hidden">Previous</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/path">
                    <Button variant="outline" className="gap-1.5 text-sm">
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Back to Path</span>
                      <span className="sm:hidden">Path</span>
                    </Button>
                  </Link>
                )}
                {nextModuleId ? (
                  <Link href={`/learn/${nextModuleId}`}>
                    <Button className="gap-1.5 text-sm">
                      <span className="hidden sm:inline">Next Module</span>
                      <span className="sm:hidden">Next</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button className="gap-1.5 text-sm">
                      <span className="hidden sm:inline">View Dashboard</span>
                      <span className="sm:hidden">Dashboard</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Companion toggle button — hidden when panel is open */}
        {!showCompanion && (
          <button
            onClick={() => setShowCompanion(true)}
            aria-label="Open learning companion"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-colors z-40 bg-card border border-border text-foreground hover:bg-muted"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        )}

        {/* Companion panel — overlay on mobile, sidebar on desktop */}
        {showCompanion && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              aria-hidden="true"
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
