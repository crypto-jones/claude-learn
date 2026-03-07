'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { LearnerRole, LEARNER_ROLES } from '@/lib/types';
import { streamChat } from '@/lib/claude';
import { Sparkles, Loader2 } from 'lucide-react';

interface AdaptedContentProps {
  sectionContent: string;
  role: LearnerRole;
  moduleId: string;
  sectionId: string;
}

function getCacheKey(moduleId: string, sectionId: string, role: string): string {
  return `claude-learn-adapted-${moduleId}-${sectionId}-${role}`;
}

export function AdaptedContent({ sectionContent, role, moduleId, sectionId }: AdaptedContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  const roleLabel = LEARNER_ROLES.find((r) => r.id === role)?.label || role;

  useEffect(() => {
    // Check cache first
    const cacheKey = getCacheKey(moduleId, sectionId, role);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setContent(cached);
      return;
    }

    // Set up IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          fetchAdaptedContent();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [moduleId, sectionId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAdaptedContent() {
    setIsLoading(true);
    setHasError(false);
    let accumulated = '';

    // Send a trimmed version of the content (first 800 chars for cost control)
    const trimmedContent = sectionContent.slice(0, 800);

    await streamChat(
      {
        messages: [{ role: 'user', content: trimmedContent }],
        mode: 'adapt',
        context: { role },
      },
      (text) => {
        accumulated += text;
        setContent(accumulated);
      },
      () => {
        setIsLoading(false);
        // Cache the result
        if (accumulated.trim()) {
          const cacheKey = getCacheKey(moduleId, sectionId, role);
          localStorage.setItem(cacheKey, accumulated);
        }
      },
      () => {
        setIsLoading(false);
        setHasError(true);
      }
    );
  }

  // Don't render anything if there was an error and no content
  if (hasError && !content) return <div ref={containerRef} />;

  return (
    <div ref={containerRef}>
      {(content || isLoading) && (
        <Card className="p-3 bg-primary/5 border-primary/15 mt-3">
          <div className="flex items-start gap-2">
            {isLoading && !content ? (
              <Loader2 className="h-3.5 w-3.5 text-primary mt-0.5 animate-spin shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-xs font-medium text-primary">
                For you as a {roleLabel}
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {content || 'Generating a role-specific example...'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
