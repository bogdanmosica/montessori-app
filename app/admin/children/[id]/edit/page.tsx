import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';
import { db } from '@/lib/db';
import { children } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EditChildForm } from './components/edit-child-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditChildPage({ params }: PageProps) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check admin role
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Get school ID
  const schoolIdRaw = session.user.schoolId || session.user.teamId;
  if (!schoolIdRaw) {
    redirect('/dashboard');
  }

  const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;
  const { id: childId } = await params;

  // Fetch child data
  const [child] = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.schoolId, schoolId)))
    .limit(1);

  if (!child) {
    redirect('/admin/children');
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/children/${childId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Child Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Update information for {child.firstName} {child.lastName}
          </p>
        </div>

        {/* Edit Form */}
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Child Information</CardTitle>
            <CardDescription>
              Update the child's personal information, enrollment details, and special requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditChildForm
              childId={childId}
              initialData={{
                firstName: child.firstName,
                lastName: child.lastName,
                dateOfBirth: child.dateOfBirth.toISOString(),
                monthlyFee: child.monthlyFee,
                gender: child.gender,
                startDate: child.startDate.toISOString(),
                specialNeeds: child.specialNeeds,
                medicalConditions: child.medicalConditions,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
