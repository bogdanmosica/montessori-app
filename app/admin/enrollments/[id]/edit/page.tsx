import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EnrollmentForm } from '../../components/EnrollmentForm';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import { notFound } from 'next/navigation';

interface EditEnrollmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEnrollmentPage({ params }: EditEnrollmentPageProps) {
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

  // Get enrollment ID
  const { id: enrollmentId } = await params;

  // Fetch enrollment data with fee information
  const enrollmentWithFee = await EnrollmentService.getEnrollmentWithEffectiveFee(enrollmentId, schoolId);

  if (!enrollmentWithFee) {
    notFound();
  }

  const enrollment = enrollmentWithFee.enrollment;
  const child = enrollmentWithFee.child;

  // Convert monthlyFeeOverride from cents to RON for the form
  const monthlyFeeOverrideRon = enrollment.monthlyFeeOverride !== null
    ? enrollment.monthlyFeeOverride / 100
    : undefined;

  // Prepare default values for the form
  const defaultValues = {
    enrollment: {
      enrollmentDate: enrollment.enrollmentDate.toISOString().split('T')[0],
      monthlyFeeOverride: monthlyFeeOverrideRon,
      notes: enrollment.notes || '',
    },
    child: {
      existingChildId: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
    },
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Edit Enrollment</h1>
                <p className="text-gray-500 mt-1">
                  Update enrollment details for {child.firstName} {child.lastName}
                </p>
              </div>
            </div>

            {/* Form */}
            <EnrollmentForm
              mode="edit"
              enrollmentId={enrollmentId}
              defaultValues={defaultValues}
            />
          </div>
        </div>
      </div>
    </>
  );
}