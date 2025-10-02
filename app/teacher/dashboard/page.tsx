import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardEmpty from './components/dashboard-empty';
import TeacherNavigation from '@/components/teacher/teacher-navigation';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTeacherDashboardData } from '@/lib/services/teacher-service';

export default async function TeacherDashboardPage() {
  // Get session
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Fetch teacher data
  const teacherData = await getTeacherDashboardData(session.user.id);

  if (!teacherData) {
    redirect('/unauthorized');
  }

  const { metrics, students } = teacherData;
  const hasStudents = metrics.totalStudents > 0;

  return (
    <>
      <TeacherNavigation />
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome to your teacher dashboard. Manage your students and track their progress.
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="space-y-0 pb-2">
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-2xl">{metrics.totalStudents}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {hasStudents ? 'Students assigned to you' : 'No students assigned yet'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-0 pb-2">
                  <CardDescription>Active Students</CardDescription>
                  <CardTitle className="text-2xl">{metrics.activeStudents}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Currently enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-0 pb-2">
                  <CardDescription>Inactive Students</CardDescription>
                  <CardTitle className="text-2xl">{metrics.inactiveStudents}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Temporarily not attending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Students List or Empty State */}
            {hasStudents ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Students</CardTitle>
                  <CardDescription>
                    Your assigned students overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.slice(0, 5).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.classGroup || 'No class assigned'}
                          </p>
                        </div>
                        <Badge
                          variant={student.enrollmentStatus === 'ACTIVE' ? 'default' : 'secondary'}
                        >
                          {student.enrollmentStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DashboardEmpty />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
