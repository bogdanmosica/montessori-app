import { Suspense } from 'react';
import { ApplicationsList } from './components/applications-list';
import { ApplicationSearch } from './components/application-search';
import { ApplicationFilters } from './components/application-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

interface ApplicationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
    search?: string;
    type?: 'application' | 'enrolled';
  }>;
}

// Mock school ID - in production this would come from auth context
const SCHOOL_ID = 1;

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const status = params.status;
  const search = params.search;
  const type = params.type;

  return (
    <div className="min-h-screen bg-gray-50/30">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity Used</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.5%</div>
                <p className="text-xs text-muted-foreground">
                  1 of 200 spots
                </p>
              </CardContent>
            </Card>
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
                  schoolId={SCHOOL_ID}
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