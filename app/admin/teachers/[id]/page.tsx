import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Users } from 'lucide-react';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/admin-navigation';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherService } from '@/lib/services/teacher-service';
import { StudentAssignmentForm } from '../components/StudentAssignmentForm';
import { TeacherActions } from '../components/TeacherActions';
import { TeacherStatusBadge } from '../components/TeacherStatusBadge';

interface TeacherDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
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

  const { id } = await params;

  // Fetch teacher data
  const teacherData = await TeacherService.getTeacherById(id, schoolId);

  if (!teacherData) {
    redirect('/admin/teachers');
  }

  const { teacher, assignedStudents } = teacherData;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/teachers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Teachers
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{teacher.user.name}</h1>
                  <TeacherStatusBadge isActive={teacher.isActive} />
                </div>
                <p className="text-muted-foreground mt-1">{teacher.user.email}</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/admin/teachers/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Teacher
              </Link>
            </Button>
          </div>

          {/* Teacher Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{teacher.user.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{teacher.user.email}</div>
                </div>
                {teacher.wage && (
                  <div>
                    <div className="text-sm text-muted-foreground">Wage</div>
                    <div className="font-medium">${parseFloat(teacher.wage).toFixed(2)}</div>
                  </div>
                )}
                {teacher.nationality && (
                  <div>
                    <div className="text-sm text-muted-foreground">Nationality</div>
                    <div className="font-medium">{teacher.nationality}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {new Date(teacher.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="font-medium">
                    {new Date(teacher.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Assigned Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assigned Students ({assignedStudents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignedStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedStudents.map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                        >
                          <span className="font-medium">{student.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Assigned {new Date(student.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <TeacherActions
                teacherId={id}
                teacherName={teacher.user.name}
                isActive={teacher.isActive}
              />
            </div>
          </div>

          {/* Student Assignment Form */}
          <StudentAssignmentForm teacherId={id} />
        </div>
      </div>
    </div>
  );
}
