/**
 * Loading State for Progress Board
 */

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-96 rounded bg-gray-200" />
        </div>

        {/* Filters Skeleton */}
        <div className="mb-6 flex items-center gap-4 animate-pulse">
          <div className="h-10 w-48 rounded bg-gray-200" />
          <div className="h-10 w-48 rounded bg-gray-200" />
          <div className="ml-auto h-10 w-40 rounded bg-gray-200" />
        </div>

        {/* Columns Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border-2 border-gray-200 bg-white">
              <div className="border-b-2 border-gray-200 p-4">
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-24 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
