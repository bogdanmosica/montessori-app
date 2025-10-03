import React from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAttendanceForDate } from '@/lib/services/attendance-service';
import { getTeacherRoster } from '@/lib/services/roster-service';
import { teachers } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import AttendanceTable from './components/AttendanceTable';
import DatePicker from './components/DatePicker';
import EmptyState from './components/EmptyState';

/**
 * Teacher Attendance Page
 *
 * Server component that displays daily attendance for teacher's roster.
 * Allows teachers to mark students as present/absent and add daily notes.
 */
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // Get session
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get teacher record
  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacher) {
    redirect('/unauthorized');
  }

  // Parse date from query params or use today
  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split('T')[0];

  // Fetch attendance data and roster
  const [attendanceData, roster] = await Promise.all([
    getAttendanceForDate(session.user.id, teacher.schoolId, selectedDate),
    getTeacherRoster(session.user.id, teacher.schoolId),
  ]);

  const hasStudents = roster.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Attendance</h1>
            <p className="text-muted-foreground mt-2">
              Record attendance for your students
            </p>
          </div>

          {/* Date Picker */}
          <DatePicker currentDate={selectedDate} />
        </div>

        {/* Attendance Summary Cards */}
        {hasStudents && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{attendanceData.metadata.totalStudents}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Students in your class
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardDescription>Recorded</CardDescription>
                <CardTitle className="text-2xl">{attendanceData.metadata.recordedAttendance}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Attendance records today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-0 pb-2">
                <CardDescription>Pending Consensus</CardDescription>
                <CardTitle className="text-2xl">{attendanceData.metadata.pendingConsensus}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Awaiting co-teacher confirmation
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Table or Empty State */}
        {hasStudents ? (
          <Card>
            <CardHeader>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                Mark attendance and add daily notes for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTable
                attendanceRecords={attendanceData.attendanceRecords}
                studentsWithoutAttendance={attendanceData.studentsWithoutAttendance}
                date={selectedDate}
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
