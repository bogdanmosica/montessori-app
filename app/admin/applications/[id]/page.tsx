import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { getApplicationDetail } from '@/lib/services/application-queries';
import { ApplicationDetail } from '../components/application-detail';
import { ApplicationActions } from '../components/application-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params: paramsPromise }: ApplicationDetailPageProps) {
  const params = await paramsPromise;
  // Verify admin authentication
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect('/unauthorized');
  }

  const schoolId = session.user.schoolId || session.user.teamId;
  if (!schoolId) {
    redirect('/unauthorized');
  }

  // Fetch application detail
  const application = await getApplicationDetail(params.id, parseInt(schoolId));

  if (!application) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/applications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Application Details
          </h1>
          <p className="text-muted-foreground">
            {application.child_first_name} {application.child_last_name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Suspense fallback={<ApplicationDetailSkeleton />}>
            <ApplicationDetail application={application} />
          </Suspense>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-32 bg-muted rounded-lg animate-pulse" />}>
            <ApplicationActions
              application={application}
              adminUserId={parseInt(session.user.id)}
              schoolId={parseInt(schoolId)}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}