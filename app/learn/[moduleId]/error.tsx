'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Module error:', error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex items-center justify-center p-8 mt-20">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Module Error
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'Something went wrong loading this module.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/path">
              <Button variant="ghost" className="gap-2">
                <Home className="h-4 w-4" />
                Learning Path
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
