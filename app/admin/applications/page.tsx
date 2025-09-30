import { Suspense } from 'react';
import { ApplicationsList } from './components/applications-list';
import { ApplicationSearch } from './components/application-search';
import { ApplicationFilters } from './components/application-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/admin-navigation';
import { getApplicationsMetrics } from '@/lib/services/applications-metrics';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';

interface ApplicationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
    search?: string;
    type?: 'application' | 'enrolled';
  }>;
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  // Check authentication and get school ID
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect('/unauthorized');
  }

  const schoolId = session.user.teamId;
  if (!schoolId) {
    redirect('/unauthorized');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const status = params.status;
  const search = params.search;
  const type = params.type;

  // Fetch real metrics
  const metrics = await getApplicationsMetrics(schoolId);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Applications & Enrollments</h1>
              <p className="text-muted-foreground">
                Manage student applications and current enrollments
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/applications/create-child">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pendingApplications}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </MetricCard>

            <MetricCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </MetricCard>

            <MetricCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </MetricCard>

            <MetricCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity Used</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.capacityUsed.percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.capacityUsed.enrolled} of {metrics.capacityUsed.totalCapacity} spots
                </p>
              </CardContent>
            </MetricCard>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <ApplicationSearch currentSearch={search} />
                </div>
                <div className="flex gap-2">
                  <ApplicationFilters 
                    currentStatus={status}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {status ? `${status.charAt(0) + status.slice(1).toLowerCase()} Items` : 'All Items'}
                {type && ` (${type === 'application' ? 'Applications' : 'Enrolled Children'})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ApplicationsListSkeleton />}>
                <ApplicationsList
                  schoolId={schoolId}
                  page={page}
                  limit={limit}
                  status={status}
                  search={search}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the applications list
function ApplicationsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}