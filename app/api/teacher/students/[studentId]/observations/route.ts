/**
 * GET /api/teacher/students/[studentId]/observations
 * POST /api/teacher/students/[studentId]/observations
 *
 * Retrieve or create observations for a specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { validateTeacherStudentAccess, getTeacherSchoolId } from '@/lib/auth/teacher-access';
import {
  getObservationsByStudentId,
  createObservation,
} from '@/lib/services/observation-service';
import { OBSERVATION_MESSAGES, OBSERVATION_CONSTANTS } from '@/lib/constants/observations';
import { z } from 'zod';

// Validation schema for creating observations
const createObservationSchema = z.object({
  note: z
    .string()
    .min(OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_SHORT,
    })
    .max(OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_LONG,
    }),
});

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

    // Get the teacher's schoolId
    const teacherUserId = parseInt(session.user.id);
    const schoolId = await getTeacherSchoolId(teacherUserId);
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
      teacherUserId,
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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(
      searchParams.get('limit') || String(OBSERVATION_CONSTANTS.DEFAULT_PAGE_SIZE),
      10
    );

    // Get observations for the student
    const result = await getObservationsByStudentId(studentId, {
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch observations',
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Get the teacher's schoolId
    const teacherUserId = parseInt(session.user.id);
    const schoolId = await getTeacherSchoolId(teacherUserId);
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
      teacherUserId,
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

    // Parse and validate request body
    const body = await request.json();
    const validation = createObservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: validation.error.errors[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    // Create the observation
    const observation = await createObservation({
      studentId,
      teacherId: teacherUserId,
      note: validation.data.note,
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create observation',
      },
      { status: 500 }
    );
  }
}
