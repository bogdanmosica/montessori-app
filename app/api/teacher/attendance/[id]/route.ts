/**
 * Teacher Attendance API Routes - Individual Record Operations
 *
 * PUT    /api/teacher/attendance/[id] - Update attendance record
 * DELETE /api/teacher/attendance/[id] - Delete attendance record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { teachers } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import {
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceForDate,
} from '@/lib/services/attendance-service';
import { processConsensus } from '@/lib/services/consensus-service';
import { updateAttendanceRequestSchema } from '@/lib/validations/attendance-validation';
import { AttendanceStatus } from '@/lib/constants/attendance-status';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/teacher/attendance/[id]
 *
 * Update existing attendance record.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Await params
    const params = await context.params;
    const attendanceId = params.id;

    // Verify authentication and role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Verify teacher role
    if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Teacher role required',
          },
        },
        { status: 403 }
      );
    }

    // Get teacher record
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Teacher record not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateAttendanceRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Get existing attendance record
    const existingRecord = await getAttendanceById(
      attendanceId,
      session.user.id,
      teacher.schoolId
    );

    if (!existingRecord) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Attendance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: { status?: AttendanceStatus; notes?: string | null } = {};

    if (validation.data.notes !== undefined) {
      updates.notes = validation.data.notes;
    }

    if (validation.data.status !== undefined) {
      // Process consensus logic for status changes
      const finalStatus = await processConsensus(
        existingRecord.studentId,
        existingRecord.date,
        teacher.schoolId,
        session.user.id,
        validation.data.status as AttendanceStatus
      );
      updates.status = finalStatus;
    }

    // Update attendance record
    const updatedRecord = await updateAttendance(
      attendanceId,
      session.user.id,
      teacher.schoolId,
      updates
    );

    if (!updatedRecord) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Attendance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch complete record with student details
    const attendanceData = await getAttendanceForDate(
      session.user.id,
      teacher.schoolId,
      existingRecord.date
    );

    const completeRecord = attendanceData.attendanceRecords.find(
      (r) => r.id === updatedRecord.id
    );

    return NextResponse.json(completeRecord);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update attendance record',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/attendance/[id]
 *
 * Delete attendance record (for corrections).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Await params
    const params = await context.params;
    const attendanceId = params.id;

    // Verify authentication and role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Verify teacher role
    if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Teacher role required',
          },
        },
        { status: 403 }
      );
    }

    // Get teacher record
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Teacher record not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete attendance record
    const deleted = await deleteAttendance(
      attendanceId,
      session.user.id,
      teacher.schoolId
    );

    if (!deleted) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Attendance record not found',
          },
        },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete attendance record',
        },
      },
      { status: 500 }
    );
  }
}
