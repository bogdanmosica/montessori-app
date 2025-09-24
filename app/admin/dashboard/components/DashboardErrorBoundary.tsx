// T036: Error boundary for dashboard components
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorReport(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Default error fallback UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-red-700">
              <p className="font-medium">Something went wrong while loading this component.</p>
              <p className="mt-1 text-xs">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-xs text-red-600">
                <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
                <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different dashboard sections

export function MetricsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary
      fallback={({ error, retry }) => (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-medium text-orange-800">Metrics Unavailable</h3>
              <p className="text-sm text-orange-600 mt-1">
                Unable to load dashboard metrics. Please try again.
              </p>
            </div>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      onError={(error) => {
        console.error('Metrics component error:', error);
        // Track metrics loading errors specifically
      }}
    >
      {children}
    </DashboardErrorBoundary>
  );
}

export function ChartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary
      fallback={({ error, retry }) => (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-blue-800 mb-1">Chart Loading Error</h3>
            <p className="text-sm text-blue-600 mb-4">
              The chart couldn't be rendered due to a data formatting issue.
            </p>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reload Chart
            </Button>
          </CardContent>
        </Card>
      )}
      onError={(error) => {
        console.error('Chart component error:', error);
        // Track chart rendering errors specifically
      }}
    >
      {children}
    </DashboardErrorBoundary>
  );
}

export function AlertsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary
      fallback={({ error, retry }) => (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Security alerts temporarily unavailable
                </span>
              </div>
              <Button onClick={retry} variant="ghost" size="sm" className="text-yellow-700">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      onError={(error) => {
        console.error('Security alerts error:', error);
        // Track security alerts errors specifically
      }}
    >
      {children}
    </DashboardErrorBoundary>
  );
}

export default DashboardErrorBoundary;