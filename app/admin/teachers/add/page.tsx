import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/admin-navigation';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherForm } from '../components/TeacherForm';

export default async function AddTeacherPage() {
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

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/teachers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teachers
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Add Teacher</h1>
              <p className="text-muted-foreground mt-1">Create a new teacher account</p>
            </div>
          </div>

          {/* Teacher Form */}
          <div className="max-w-2xl">
            <TeacherForm mode="create" />
          </div>
        </div>
      </div>
    </div>
  );
}
