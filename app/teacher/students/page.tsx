import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RosterEmpty from './components/roster-empty';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTeacherStudentRoster } from '@/lib/services/teacher-service';
import { getObservationCount } from '@/lib/services/observation-service';
import Link from 'next/link';

export default async function TeacherStudentsPage() {
  // Get session
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Fetch student roster
  const rosterData = await getTeacherStudentRoster(session.user.id);

  if (!rosterData) {
    redirect('/unauthorized');
  }

  const { students, classGroups, totalCount } = rosterData;
  const hasStudents = totalCount > 0;

  // Get observation counts for all students
  const studentsWithObservationCounts = await Promise.all(
    students.map(async (student) => {
      const observationCount = await getObservationCount(student.id);
      return { ...student, observationCount };
    })
  );

  // Calculate age helper
  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Roster</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all students assigned to you. Total: {totalCount}
              </p>
            </div>

            {hasStudents ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="space-y-0 pb-2">
                      <CardDescription>Class Groups</CardDescription>
                      <CardTitle className="text-2xl">{classGroups.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {classGroups.join(', ') || 'No class groups'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="space-y-0 pb-2">
                      <CardDescription>Active Students</CardDescription>
                      <CardTitle className="text-2xl">
                        {studentsWithObservationCounts.filter(s => s.enrollmentStatus === 'ACTIVE').length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Currently enrolled
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="space-y-0 pb-2">
                      <CardDescription>Total Observations</CardDescription>
                      <CardTitle className="text-2xl">
                        {studentsWithObservationCounts.reduce((sum, s) => sum + s.observationCount, 0)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Across all students
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Students List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>
                      Complete list of students assigned to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentsWithObservationCounts.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {student.firstName} {student.lastName}
                              </p>
                              <Badge
                                variant={student.enrollmentStatus === 'ACTIVE' ? 'default' : 'secondary'}
                              >
                                {student.enrollmentStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{student.classGroup || 'No class'}</span>
                              <span>•</span>
                              <span>Age: {calculateAge(student.dateOfBirth)}</span>
                              <span>•</span>
                              <span>{student.gender}</span>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">
                                {student.observationCount} {student.observationCount === 1 ? 'observation' : 'observations'}
                              </span>
                            </div>
                          </div>
                          <Link href={`/teacher/students/${student.id}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <RosterEmpty />
            )}
          </div>
        </div>
  );
}
