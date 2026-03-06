'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <Card className="p-6 max-w-md text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
