import { getCombinedApplicationsAndChildren } from '@/lib/services/combined-applications-children';
import { ApplicationStatusBadge } from './application-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Mail, Clock, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ApplicationsListProps {
  schoolId: number;
  page: number;
  limit: number;
  status?: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
  search?: string;
}

export async function ApplicationsList({
  schoolId,
  page,
  limit,
  status,
  search,
}: ApplicationsListProps) {
  try {
    const result = await getCombinedApplicationsAndChildren({
      schoolId,
      page,
      limit,
      status,
      search,
    });

    if (result.items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {search || status ? 'No items found matching your criteria.' : 'No applications or enrolled children yet.'}
          </div>
          {!search && !status && (
            <Button asChild>
              <Link href="/admin/applications/create-child">
                Add First Child
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Items Grid */}
        <div className="grid gap-4">
          {result.items.map((item) => (
            <ItemCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>

        {/* Pagination */}
        <PaginationControls pagination={result.pagination} />
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          Failed to load data. Please try again.
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/applications">Refresh</Link>
        </Button>
      </div>
    );
  }
}

interface ItemCardProps {
  item: {
    id: string;
    type: 'application' | 'enrolled';
    status: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
    child_first_name: string;
    child_last_name: string;
    child_date_of_birth: string;
    start_date: string;
    parent1_first_name: string;
    parent1_last_name: string;
    parent1_email: string;
    submitted_at: string;
    processed_at: string | null;
  };
}

function ItemCard({ item }: ItemCardProps) {
  const childAge = Math.floor(
    (Date.now() - new Date(item.child_date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const isApplication = item.type === 'application';
  const isEnrolled = item.type === 'enrolled';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-lg">
                {item.child_first_name} {item.child_last_name}
              </h3>
              <p className="text-sm text-muted-foreground">Age: {childAge} years</p>
            </div>
            {isEnrolled && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Enrolled
              </Badge>
            )}
          </div>
          <ApplicationStatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Parent Information */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              {item.parent1_first_name} {item.parent1_last_name}
            </span>
          </div>

          {/* Parent Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{item.parent1_email}</span>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {isApplication ? 'Preferred Start' : 'Start Date'}: {format(new Date(item.start_date), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Submission/Creation Date */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {isApplication ? 'Submitted' : 'Created'}: {format(new Date(item.submitted_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {item.processed_at && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Processed: {format(new Date(item.processed_at), 'MMM d, yyyy')}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button asChild variant="outline">
            <Link href={
              isApplication 
                ? `/admin/applications/${item.id}` 
                : `/admin/children/${item.id}`
            }>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PaginationControlsProps {
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

function PaginationControls({ pagination }: PaginationControlsProps) {
  if (pagination.total_pages <= 1) return null;

  const currentParams = new URLSearchParams(window?.location?.search || '');

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total_items)} of{' '}
        {pagination.total_items} applications
      </div>

      <div className="flex gap-2">
        {pagination.has_prev && (
          <Button asChild variant="outline" size="sm">
            <Link
              href={`?${new URLSearchParams({
                ...Object.fromEntries(currentParams.entries()),
                page: (pagination.page - 1).toString(),
              }).toString()}`}
            >
              Previous
            </Link>
          </Button>
        )}

        <Badge variant="secondary">
          Page {pagination.page} of {pagination.total_pages}
        </Badge>

        {pagination.has_next && (
          <Button asChild variant="outline" size="sm">
            <Link
              href={`?${new URLSearchParams({
                ...Object.fromEntries(currentParams.entries()),
                page: (pagination.page + 1).toString(),
              }).toString()}`}
            >
              Next
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}