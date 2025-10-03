import React from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getStudentById, calculateAge } from '@/lib/services/student-service';
import { validateTeacherStudentAccess, getTeacherSchoolId } from '@/lib/auth/teacher-access';
import { getRecentObservations } from '@/lib/services/observation-service';
import { StudentProfile } from '../components/StudentProfile';
import { ObservationList } from '../components/ObservationList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { studentId } = await params;

  // Get session
  const session = await getSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get the teacher's schoolId
  const teacherUserId = parseInt(session.user.id);
  const schoolId = await getTeacherSchoolId(teacherUserId);
  if (!schoolId) {
    redirect('/unauthorized');
  }

  // Validate teacher has access to this student
  const hasAccess = await validateTeacherStudentAccess(
    teacherUserId,
    studentId,
    schoolId
  );

  if (!hasAccess) {
    redirect('/unauthorized');
  }

  // Get student details
  const student = await getStudentById(studentId, schoolId);

  if (!student) {
    redirect('/teacher/students');
  }

  // Get recent observations
  const recentObservations = await getRecentObservations(studentId);

  // Calculate age
  const age = calculateAge(student.dateOfBirth);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href="/teacher/students">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Student Profile & Observations
          </p>
        </div>

        {/* Student Profile */}
        <StudentProfile student={{ ...student, age }} />

        {/* Observations Section */}
        <ObservationList
          studentId={studentId}
          teacherId={teacherUserId}
          initialObservations={recentObservations}
        />
      </div>
    </div>
  );
}
