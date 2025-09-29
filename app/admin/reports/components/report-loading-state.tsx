import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface ReportLoadingStateProps {
  message?: string;
  className?: string;
}

export function ReportLoadingState({
  message = 'Generating report...',
  className
}: ReportLoadingStateProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg font-medium">{message}</p>
        </div>

        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* Skeleton Table */}
        <div className="space-y-4">
          {/* Table Header Skeleton */}
          <div className="flex space-x-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>

          {/* Table Rows Skeleton */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>

        {/* Loading Steps */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Validating filters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Querying database</span>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-2 w-2 animate-spin text-primary" />
            <span>Processing data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
            <span>Formatting results</span>
          </div>
        </div>
      </div>
    </Card>
  );
}