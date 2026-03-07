'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLearner } from '@/contexts/LearnerContext';
import { BarChart3, Route, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navigation() {
  const pathname = usePathname();
  const { profile } = useLearner();

  const isAssessment = pathname === '/assess';
  const isLanding = pathname === '/';

  if (isAssessment) {
    return (
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Claude Learn</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    );
  }

  if (isLanding) return null;

  const links = [
    ...(profile.assessmentComplete
      ? [
          { href: '/path', label: 'Learning Path', icon: Route },
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Claude Learn</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
