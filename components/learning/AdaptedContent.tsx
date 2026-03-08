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
  staticExample?: string;
}

function getCacheKey(moduleId: string, sectionId: string, role: string): string {
  return `claude-learn-adapted-${moduleId}-${sectionId}-${role}`;
}

export function AdaptedContent({ sectionContent, role, moduleId, sectionId, staticExample }: AdaptedContentProps) {
  const [content, setContent] = useState<string | null>(staticExample || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  const roleLabel = LEARNER_ROLES.find((r) => r.id === role)?.label || role;

  // If we have a static example, render it immediately — no API call needed
  const isStatic = !!staticExample;

  useEffect(() => {
    // Static examples don't need fetching
    if (isStatic) return;

    // Check cache first
    const cacheKey = getCacheKey(moduleId, sectionId, role);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setContent(cached);
      return;
    }

    // Observe the parent section element (which is tall and enters the viewport
    // earlier) instead of this small container div. This ensures we start fetching
    // as soon as the user begins reading the section, not after they've scrolled
    // past all the section content.
    const sectionEl = document.getElementById(`section-${sectionId}`);
    const observeTarget = sectionEl || containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          fetchAdaptedContent();
        }
      },
      { threshold: 0, rootMargin: '200px 0px' }
    );

    if (observeTarget) {
      observer.observe(observeTarget);
    }

    return () => observer.disconnect();
  }, [moduleId, sectionId, role, isStatic]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div ref={containerRef} className={!content && !isLoading ? 'min-h-[1px]' : undefined}>
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
                {role === 'getting-started' ? 'Real-world example' : `For you as a ${roleLabel}`}
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
