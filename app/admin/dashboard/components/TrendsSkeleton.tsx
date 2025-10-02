import { Skeleton } from '@/components/ui/skeleton';

export function TrendsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Controls skeleton */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="h-64 flex items-end justify-between gap-2 px-4">
        {[85, 70, 90, 65, 75, 80, 95].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <Skeleton
              className="w-full"
              style={{
                height: `${height}%`,
              }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="flex justify-center gap-4 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
