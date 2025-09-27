import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title = 'No enrollments found',
  description = 'Get started by creating your first enrollment.',
  actionLabel = 'Add New Enrollment',
  actionHref = '/admin/enrollments/new',
  icon: Icon = Users,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        <p className="text-gray-500 mb-6 max-w-sm">
          {description}
        </p>

        <Button asChild>
          <Link href={actionHref} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SearchEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      title="No enrollments match your search"
      description={`No enrollments found for "${searchTerm}". Try adjusting your search terms or filters.`}
      actionLabel="Clear Search"
      actionHref="/admin/enrollments"
      icon={Users}
    />
  );
}

export function FilterEmptyState({
  filterType,
  filterValue
}: {
  filterType: string;
  filterValue: string;
}) {
  return (
    <EmptyState
      title={`No ${filterValue} enrollments`}
      description={`There are currently no enrollments with ${filterType} "${filterValue}".`}
      actionLabel="View All Enrollments"
      actionHref="/admin/enrollments"
      icon={Users}
    />
  );
}