import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { CreateChildForm } from './components/create-child-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function CreateChildPage() {
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
            Add New Child
          </h1>
          <p className="text-muted-foreground">
            Create a child profile directly (bypassing application process)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl">
        <Suspense fallback={<CreateChildFormSkeleton />}>
          <CreateChildForm 
            adminUserId={parseInt(session.user.id)}
            schoolId={typeof schoolId === 'string' ? parseInt(schoolId) : schoolId}
          />
        </Suspense>
      </div>
    </div>
  );
}

function CreateChildFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 bg-muted rounded" />
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
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <div className="h-10 bg-muted rounded w-20" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
    </div>
  );
}