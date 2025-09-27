import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EnrollmentForm } from '../components/EnrollmentForm';

export default async function NewEnrollmentPage() {
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

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/enrollments" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Enrollments
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Enrollment</h1>
                <p className="text-gray-500 mt-1">
                  Enroll a new or existing child in your school
                </p>
              </div>
            </div>

            {/* Form */}
            <EnrollmentForm mode="create" />
          </div>
        </div>
      </div>
    </>
  );
}