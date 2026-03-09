'use client';

import { useState, useEffect, useRef } from 'react';
import { useLearner } from '@/contexts/LearnerContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { streamChat } from '@/lib/claude';
import { renderChatMarkdown } from '@/lib/render-markdown';
import { Module, ModuleSection, LearnerRole } from '@/lib/types';
import { Terminal, Send, Loader2, RotateCcw, ChevronUp } from 'lucide-react';

interface PromptPlaygroundProps {
  section: ModuleSection;
  moduleData: Module;
}

function resolveTemplate(section: ModuleSection, role: LearnerRole | null) {
  const base = section.playground!;
  const variant = role ? base.roleVariants?.[role] : undefined;
  return {
    systemPrompt: variant?.systemPrompt || base.systemPrompt,
    userMessage: variant?.userMessage || base.userMessage,
    description: variant?.description || base.description,
  };
}

export function PromptPlayground({ section, moduleData }: PromptPlaygroundProps) {
  const { profile } = useLearner();
  const template = resolveTemplate(section, profile.role);

  const [isOpen, setIsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(template.systemPrompt);
  const [userMessage, setUserMessage] = useState(template.userMessage);
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const lastRole = useRef(profile.role);

  // Update template when role changes (e.g., profile loads async)
  useEffect(() => {
    if (profile.role !== lastRole.current) {
      lastRole.current = profile.role;
      setSystemPrompt(template.systemPrompt);
      setUserMessage(template.userMessage);
    }
  }, [profile.role, template.systemPrompt, template.userMessage]);

  const handleSend = async () => {
    if (!userMessage.trim() || isStreaming) return;
    setIsStreaming(true);
    setResponse('');
    setHasSubmitted(true);
    let accumulated = '';

    await streamChat(
      {
        messages: [{ role: 'user', content: userMessage.trim() }],
        mode: 'playground',
        context: {
          role: profile.role || undefined,
          moduleTitle: moduleData.title,
          sectionTitle: section.title,
          playgroundSystemPrompt: systemPrompt.trim(),
        },
      },
      (text) => {
        accumulated += text;
        setResponse(accumulated);
      },
      () => {
        setIsStreaming(false);
      },
      () => {
        setResponse('Unable to get a response. Please try again.');
        setIsStreaming(false);
      }
    );
  };

  const handleReset = () => {
    setSystemPrompt(template.systemPrompt);
    setUserMessage(template.userMessage);
    setResponse('');
    setHasSubmitted(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5"
      >
        <Terminal className="h-3.5 w-3.5" />
        Try it
      </Button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Card className="p-5 border-primary/20 bg-primary/[0.02]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Prompt Playground</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-muted-foreground"
              disabled={isStreaming}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0 text-muted-foreground"
              disabled={isStreaming}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-muted-foreground mb-4">{template.description}</p>
        )}

        {/* System Prompt */}
        <div className="mb-3">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={isStreaming}
            rows={4}
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-base sm:text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 resize-y"
          />
        </div>

        {/* User Message */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            User Message
          </label>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            disabled={isStreaming}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 resize-y"
          />
        </div>

        {/* Send Button */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isStreaming || !userMessage.trim()}
            className="gap-1.5"
          >
            {isStreaming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send to Claude
              </>
            )}
          </Button>
        </div>

        {/* Response */}
        {hasSubmitted && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Claude&apos;s Response
            </label>
            <div className="rounded-md bg-muted/50 p-4 text-sm text-foreground leading-relaxed min-h-[60px]">
              {response ? renderChatMarkdown(response) : (
                <span className="text-muted-foreground/50 italic">Waiting for response...</span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
