/**
 * GET /api/teacher/students/[studentId]
 *
 * Retrieve detailed student profile with enrollment information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStudentById, calculateAge } from '@/lib/services/student-service';
import { validateTeacherStudentAccess } from '@/lib/auth/teacher-access';
import { getRecentObservations } from '@/lib/services/observation-service';
import { OBSERVATION_MESSAGES } from '@/lib/constants/observations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { studentId } = await params;

    // Verify authentication and role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Verify teacher role
    if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Teacher role required',
        },
        { status: 403 }
      );
    }

    // Get the teacher's teamId (schoolId)
    const schoolId = session.user.teamId;
    if (!schoolId) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'School ID not found for teacher',
        },
        { status: 400 }
      );
    }

    // Validate teacher has access to this student
    const hasAccess = await validateTeacherStudentAccess(
      session.user.id,
      studentId,
      schoolId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: OBSERVATION_MESSAGES.UNAUTHORIZED_ACCESS,
        },
        { status: 403 }
      );
    }

    // Get student details
    const student = await getStudentById(studentId, schoolId);

    if (!student) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: OBSERVATION_MESSAGES.STUDENT_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Get recent observations for the student
    const recentObservations = await getRecentObservations(studentId);

    // Calculate age
    const age = calculateAge(student.dateOfBirth);

    // Build response with student profile
    const studentProfile = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      age,
      enrollment: {
        id: student.id, // Using student ID as enrollment reference
        status: student.enrollmentStatus,
        enrollmentDate: student.startDate,
        program: null, // Can be extended later if program data is available
      },
      recentObservations: recentObservations.map(obs => ({
        id: obs.id,
        studentId: obs.studentId,
        teacherId: obs.teacherId,
        note: obs.note,
        createdAt: obs.createdAt,
        updatedAt: obs.updatedAt,
      })),
    };

    return NextResponse.json(studentProfile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch student profile',
      },
      { status: 500 }
    );
  }
}
