'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLearner } from '@/contexts/LearnerContext';
import { Button } from '@/components/ui/button';
import { Module, ChatMessage } from '@/lib/types';
import { streamChat } from '@/lib/claude';
import { X, Send, Loader2, Sparkles } from 'lucide-react';

interface CompanionPanelProps {
  moduleData: Module;
  currentSectionTitle?: string;
  currentSectionContent?: string;
  onClose: () => void;
}

export function CompanionPanel({ moduleData, currentSectionTitle, currentSectionContent, onClose }: CompanionPanelProps) {
  const { profile } = useLearner();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: currentSectionTitle
        ? `I'm here to help you with "${moduleData.title}" — specifically the "${currentSectionTitle}" section. Ask me anything!`
        : `I'm here to help you with "${moduleData.title}". Ask me anything about the concepts in this module, or if you're stuck on an exercise, I can guide you through it.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    let accumulated = '';

    await streamChat(
      {
        messages: newMessages,
        mode: 'companion',
        context: {
          role: profile.role || undefined,
          skills: profile.skills,
          moduleTitle: moduleData.title,
          sectionTitle: currentSectionTitle,
          sectionContent: currentSectionContent,
        },
      },
      (text) => {
        accumulated += text;
        setStreamingContent(accumulated);
      },
      () => {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingContent('');
        setIsStreaming(false);
      },
      () => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I'm having trouble responding right now. Please try again.",
          },
        ]);
        setIsStreaming(false);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-[100vw] sm:w-[380px] border-l border-border bg-card flex flex-col h-[calc(100vh-57px)] sticky top-[57px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Learning Companion
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close companion panel"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 ${
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

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl px-3 py-2 bg-muted text-foreground">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {streamingContent}
              </p>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            aria-label="Ask the learning companion a question"
            disabled={isStreaming}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-h-[36px] max-h-[80px]"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-[36px] w-[36px] rounded-lg shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
