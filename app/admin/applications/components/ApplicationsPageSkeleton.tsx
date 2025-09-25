import { Card, CardContent, CardHeader } from '../../../../components/ui/card';

export function ApplicationsPageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-[180px]">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-[180px]">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Results Summary Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>

        {/* Table Skeleton */}
        <div className="border rounded-md">
          {/* Table Header */}
          <div className="border-b">
            <div className="flex items-center h-12 px-4">
              <div className="grid grid-cols-7 gap-4 w-full">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border-b last:border-b-0">
              <div className="flex items-center h-16 px-4">
                <div className="grid grid-cols-7 gap-4 w-full">
                  {/* Parent Name */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>

                  {/* Child Name */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>

                  {/* Age */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>

                  {/* Program */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>

                  {/* Status */}
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>

                  {/* Date */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>

                  {/* Actions */}
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-8 ml-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between mt-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}