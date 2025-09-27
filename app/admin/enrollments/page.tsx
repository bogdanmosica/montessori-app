import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import { EnrollmentFilters } from './components/EnrollmentFilters';
import { EnrollmentsTable } from './components/EnrollmentsTable';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import type { GetEnrollmentsQuery } from './types';

// This is a server component that handles searchParams
interface EnrollmentsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function EnrollmentsContent({ searchParams }: EnrollmentsPageProps) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  try {
    requireAdminPermissions(session.user.role);
  } catch {
    redirect('/unauthorized');
  }

  const schoolId = session.user.teamId;
  if (!schoolId) {
    throw new Error('School not found in session');
  }

  // Await and parse search params
  const params = await searchParams;
  const query: GetEnrollmentsQuery = {
    status: params.status as any,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 20,
    sortBy: (params.sortBy as any) || 'enrollment_date',
    sortOrder: (params.sortOrder as any) || 'desc',
  };

  // Fetch enrollments
  const enrollmentsResponse = await EnrollmentService.getEnrollments(schoolId, query);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-500 mt-1">
            Manage student enrollments and track enrollment status
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/enrollments/new" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Enrollment
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      {enrollmentsResponse.pagination.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-semibold">{enrollmentsResponse.pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Enrollments</p>
                  <p className="text-2xl font-semibold">
                    {enrollmentsResponse.data.filter(e => e.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-3">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Page</p>
                  <p className="text-2xl font-semibold">
                    {enrollmentsResponse.data.length} of {enrollmentsResponse.pagination.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <EnrollmentFilters defaultFilters={query} />

      {/* Enrollments Table */}
      <EnrollmentsTable
        enrollments={enrollmentsResponse.data}
        filters={query}
      />

      {/* Pagination */}
      {enrollmentsResponse.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            {enrollmentsResponse.pagination.hasPrev && (
              <Button variant="outline" asChild>
                <Link href={`?${new URLSearchParams({
                  ...params,
                  page: (enrollmentsResponse.pagination.page - 1).toString()
                }).toString()}`}>
                  Previous
                </Link>
              </Button>
            )}

            <span className="text-sm text-gray-600 px-4">
              Page {enrollmentsResponse.pagination.page} of {enrollmentsResponse.pagination.totalPages}
            </span>

            {enrollmentsResponse.pagination.hasNext && (
              <Button variant="outline" asChild>
                <Link href={`?${new URLSearchParams({
                  ...params,
                  page: (enrollmentsResponse.pagination.page + 1).toString()
                }).toString()}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Loading component
function EnrollmentsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component
export default async function EnrollmentsPage(props: EnrollmentsPageProps) {
  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<EnrollmentsLoading />}>
            <EnrollmentsContent {...props} />
          </Suspense>
        </div>
      </div>
    </>
  );
}