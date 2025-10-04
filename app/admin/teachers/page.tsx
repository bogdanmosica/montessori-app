import { Suspense } from 'react';
import { TeacherList } from './components/TeacherList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/admin-navigation';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';

interface TeachersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    includeInactive?: string;
  }>;
}

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
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
  const search = params.search;
  const includeInactive = params.includeInactive === 'true';

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
              <p className="text-muted-foreground mt-1">
                Manage teacher accounts and student assignments
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/teachers/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/admin/teachers" method="GET" className="flex gap-4">
                <Input
                  name="search"
                  placeholder="Search by name or email..."
                  defaultValue={search}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="includeInactive"
                    id="includeInactive"
                    defaultChecked={includeInactive}
                    className="rounded border-gray-300"
                    value="true"
                  />
                  <label htmlFor="includeInactive" className="text-sm">
                    Include Inactive
                  </label>
                </div>
                <Button type="submit">Search</Button>
                {(search || includeInactive !== true) && (
                  <Button variant="outline" asChild>
                    <Link href="/admin/teachers">Clear</Link>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Teachers List */}
          <Suspense fallback={<TeachersListSkeleton />}>
            <TeacherList
              schoolId={schoolId}
              page={page}
              limit={limit}
              search={search}
              includeInactive={includeInactive}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TeachersListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
