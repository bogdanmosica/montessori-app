/**
 * PUT /api/teacher/observations/[observationId]
 *
 * Update an existing observation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { validateTeacherStudentAccess, getTeacherSchoolId } from '@/lib/auth/teacher-access';
import {
  getObservationById,
  updateObservation,
} from '@/lib/services/observation-service';
import { OBSERVATION_MESSAGES, OBSERVATION_CONSTANTS } from '@/lib/constants/observations';
import { z } from 'zod';

// Validation schema for updating observations
const updateObservationSchema = z.object({
  note: z
    .string()
    .min(OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_SHORT,
    })
    .max(OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_LONG,
    }),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ observationId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { observationId } = await params;

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

    // Get the observation to verify it exists and get the student ID
    const observation = await getObservationById(observationId);

    if (!observation) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: OBSERVATION_MESSAGES.OBSERVATION_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Validate teacher has access to the student
    // Per requirements, any teacher with student access can edit observations
    const hasAccess = await validateTeacherStudentAccess(
      teacherUserId,
      observation.studentId,
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
    const validation = updateObservationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: validation.error.errors[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    // Update the observation
    const updatedObservation = await updateObservation(observationId, {
      note: validation.data.note,
    });

    if (!updatedObservation) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'Failed to update observation',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedObservation);
  } catch (error) {
    console.error('Error updating observation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update observation',
      },
      { status: 500 }
    );
  }
}
