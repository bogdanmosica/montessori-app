/**
 * GET /api/teacher/students
 *
 * Retrieve all students assigned to the authenticated teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStudentsByTeacherId } from '@/lib/services/student-service';
import { getObservationCount } from '@/lib/services/observation-service';
import { calculateAge } from '@/lib/services/student-service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'You must be logged in to access this resource',
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

    // Get assigned students
    const students = await getStudentsByTeacherId(session.user.id, schoolId);

    // Enrich student data with observation counts and age
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const observationCount = await getObservationCount(student.id);
        const age = calculateAge(student.dateOfBirth);

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth,
          enrollmentStatus: student.enrollmentStatus,
          observationCount,
          age,
        };
      })
    );

    return NextResponse.json({
      students: studentsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}
