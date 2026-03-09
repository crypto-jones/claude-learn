'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLearner } from '@/contexts/LearnerContext';
import { renderChatMarkdown } from '@/lib/render-markdown';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LearnerRole,
  ExperienceLevel,
  SkillsProfile,
  SkillLevel,
  LEARNER_ROLES,
  EXPERIENCE_LEVELS,
  ROLE_SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
  ChatMessage,
} from '@/lib/types';
import { streamChat, extractAssessmentResult, generateLearningPath } from '@/lib/claude';
import { getDimensionsForRole } from '@/lib/modules';
import {
  Code2,
  BarChart3,
  Palette,
  Briefcase,
  Compass,
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  BarChart3,
  Palette,
  Briefcase,
  Compass,
};

type Step = 'role' | 'experience' | 'conversation' | 'results';

function stripAssessmentJson(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, '').trim();
}


const MAX_ASSESSMENT_TURNS = 4;

function AssessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoaded, setRole, setExperienceLevel, completeAssessment } = useLearner();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<LearnerRole | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<{
    skills: SkillsProfile;
    summary: string;
    reachableDimensions?: string[];
  } | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);
  const kickoffRef = useRef<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to /path if assessment is already complete
  useEffect(() => {
    if (isLoaded && profile.assessmentComplete) {
      router.replace('/path');
    }
  }, [isLoaded, profile.assessmentComplete, router]);

  // Pre-select role from query param (e.g., /assess?role=developer)
  useEffect(() => {
    if (profile.assessmentComplete) return; // Don't mutate profile if redirecting
    const roleParam = searchParams.get('role');
    if (roleParam && LEARNER_ROLES.some((r) => r.id === roleParam)) {
      const role = roleParam as LearnerRole;
      setSelectedRole(role);
      setRole(role);
      setStep('experience');
    }
  }, [searchParams, setRole, profile.assessmentComplete]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const startConversation = useCallback(async () => {
    if (!selectedRole || !selectedExperience) return;

    setIsStreaming(true);
    let accumulated = '';

    const kickoff: ChatMessage = {
      role: 'user',
      content: `Hi! I'm a ${selectedRole} with ${selectedExperience} experience level. Please begin my skills assessment.`,
    };
    kickoffRef.current = kickoff;

    await streamChat(
      {
        messages: [kickoff],
        mode: 'assessment',
        context: { role: selectedRole, experienceLevel: selectedExperience },
      },
      (text) => {
        accumulated += text;
        setStreamingContent(accumulated);
      },
      () => {
        setMessages([{ role: 'assistant', content: accumulated }]);
        setStreamingContent('');
        setIsStreaming(false);
        setQuestionCount(1);
      },
      () => {
        setMessages([
          {
            role: 'assistant',
            content:
              "Welcome! Let's assess your Claude skills. Tell me about a recent project where you used AI or where you think AI could help.",
          },
        ]);
        setIsStreaming(false);
        setQuestionCount(1);
      }
    );
  }, [selectedRole, selectedExperience]);

  const handleRoleSelect = (role: LearnerRole) => {
    setSelectedRole(role);
    setRole(role);
  };

  const handleExperienceSelect = (level: ExperienceLevel) => {
    setSelectedExperience(level);
    setExperienceLevel(level);
  };

  const handleNextFromRole = () => {
    if (selectedRole) setStep('experience');
  };

  const handleNextFromExperience = () => {
    if (selectedExperience) {
      setStep('conversation');
      setTimeout(() => startConversation(), 100);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setChatError(null);

    // Prepend kickoff message so the API always gets a user-first conversation
    // with full context (role + experience self-introduction)
    const apiMessages = kickoffRef.current
      ? [kickoffRef.current, ...newMessages]
      : newMessages;

    let accumulated = '';

    await streamChat(
      {
        messages: apiMessages,
        mode: 'assessment',
        context: {
          role: selectedRole || undefined,
          experienceLevel: selectedExperience || undefined,
        },
      },
      (text) => {
        accumulated += text;
        setStreamingContent(accumulated);
      },
      () => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: accumulated,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        setIsStreaming(false);

        const newCount = questionCount + 1;
        setQuestionCount(newCount);

        // Check if assessment is complete
        const result = extractAssessmentResult(accumulated);
        if (result) {
          const skills = result.skills as unknown as SkillsProfile;
          const validLevels: SkillLevel[] = ['foundations', 'practitioner', 'advanced'];
          const roleDims = ROLE_SKILL_DIMENSIONS[selectedRole || 'getting-started'];
          const validatedSkills: SkillsProfile = {};
          for (const dim of roleDims) {
            validatedSkills[dim.id] = validLevels.includes(skills[dim.id])
              ? skills[dim.id]
              : 'foundations';
          }

          setAssessmentResult({
            skills: validatedSkills,
            summary: result.summary,
            reachableDimensions: getDimensionsForRole(selectedRole || null),
          });
          setTimeout(() => setStep('results'), 1500);
        } else if (newCount > MAX_ASSESSMENT_TURNS) {
          // Force completion — default all skills to foundations since Claude
          // couldn't produce a structured result from the conversation
          const fallbackRoleDims = ROLE_SKILL_DIMENSIONS[selectedRole || 'getting-started'];
          const fallbackSkills: SkillsProfile = {};
          for (const dim of fallbackRoleDims) {
            fallbackSkills[dim.id] = 'foundations';
          }
          setAssessmentResult({
            skills: fallbackSkills,
            summary: 'Assessment completed based on your conversation. Your learning path has been personalized to help you grow.',
            reachableDimensions: getDimensionsForRole(selectedRole || null),
          });
          setTimeout(() => setStep('results'), 1500);
        }
      },
      () => {
        // Restore user's message so they can retry
        setMessages((prev) => prev.slice(0, -1));
        setInput(userMessage.content);
        setIsStreaming(false);
        setChatError('Something went wrong. Please try sending your answer again.');
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCompleteAssessment = () => {
    if (!assessmentResult) return;
    const path = generateLearningPath(
      assessmentResult.skills as unknown as Record<string, string>,
      selectedRole || 'developer'
    );
    completeAssessment(assessmentResult.skills, path);
    router.push('/path');
  };

  const progressPercent =
    step === 'role'
      ? 10
      : step === 'experience'
        ? 25
        : step === 'conversation'
          ? 25 + Math.min(questionCount * 18, 60)
          : 100;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navigation />

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6">
        <Progress value={progressPercent} className="h-1" />
        <p className="text-xs text-muted-foreground mt-2">
          {step === 'role' && 'Step 1 of 3 — Select your role'}
          {step === 'experience' && 'Step 2 of 3 — Your experience level'}
          {step === 'conversation' && `Step 3 of 3 — Skills assessment (${Math.min(questionCount, MAX_ASSESSMENT_TURNS)}/${MAX_ASSESSMENT_TURNS})`}
          {step === 'results' && 'Assessment complete'}
        </p>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {step === 'role' && (
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              What best describes you?
            </h1>
            <p className="text-muted-foreground mb-8">
              We&apos;ll tailor your assessment and learning path to your role.
            </p>
            <div className="space-y-3 stagger-children">
              {LEARNER_ROLES.map((role) => {
                const Icon = roleIcons[role.icon];
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`h-5 w-5 ${
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {role.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleNextFromRole}
                disabled={!selectedRole}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'experience' && (
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              What&apos;s your experience with AI?
            </h1>
            <p className="text-muted-foreground mb-8">
              This helps us calibrate the assessment to your level.
            </p>
            <div className="space-y-3 stagger-children">
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = selectedExperience === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => handleExperienceSelect(level.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-foreground">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep('role')}>
                Back
              </Button>
              <Button
                onClick={handleNextFromExperience}
                disabled={!selectedExperience}
                className="gap-2"
              >
                Begin Assessment
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'conversation' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-foreground">
                Skills Assessment
              </h1>
              <p className="text-sm text-muted-foreground">
                Claude will ask you {MAX_ASSESSMENT_TURNS} questions to understand your skill level.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {msg.role === 'assistant'
                        ? renderChatMarkdown(stripAssessmentJson(msg.content))
                        : msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground">
                    <div className="text-sm leading-relaxed">
                      {renderChatMarkdown(stripAssessmentJson(streamingContent))}
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claude is thinking...
                    </div>
                  </div>
                </div>
              )}

              {assessmentResult && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Assessment complete — preparing your results...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {!assessmentResult && (
              <div className="border-t border-border pt-4">
                {chatError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-2">{chatError}</p>
                )}
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your response..."
                    aria-label="Type your assessment response"
                    disabled={isStreaming}
                    className="flex-1 min-w-0 resize-none rounded-xl border border-border bg-background px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-h-[44px] max-h-[120px]"
                    rows={1}
                    maxLength={5000}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isStreaming}
                    size="icon"
                    className="h-[44px] w-[44px] rounded-xl shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'results' && assessmentResult && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Your Skills Profile
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {assessmentResult.summary}
              </p>
            </div>

            <Card className="p-6 mb-8">
              <div className="space-y-4">
                {ROLE_SKILL_DIMENSIONS[selectedRole || 'getting-started'].map((dim, idx) => {
                  const level = assessmentResult.skills[dim.id];
                  const value = SKILL_LEVEL_VALUES[level];
                  const percent = (value / 3) * 100;
                  return (
                    <div key={dim.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {dim.label}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {level}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percent}%`,
                            animationDelay: `${idx * 200}ms`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Button
              onClick={handleCompleteAssessment}
              size="lg"
              className="w-full gap-2"
            >
              See Your Learning Path
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense>
      <AssessPageInner />
    </Suspense>
  );
}
