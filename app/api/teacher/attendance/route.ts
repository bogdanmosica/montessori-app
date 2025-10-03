/**
 * Teacher Attendance API Routes
 *
 * GET  /api/teacher/attendance?date=YYYY-MM-DD - Get attendance for date
 * POST /api/teacher/attendance - Create attendance record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { teachers } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import {
  getAttendanceForDate,
  createAttendance,
} from '@/lib/services/attendance-service';
import { canTeacherAccessStudent } from '@/lib/services/roster-service';
import { determineInitialStatus } from '@/lib/services/consensus-service';
import {
  createAttendanceRequestSchema,
  getAttendanceQuerySchema,
} from '@/lib/validations/attendance-validation';
import { AttendanceStatus } from '@/lib/constants/attendance-status';

/**
 * GET /api/teacher/attendance?date=YYYY-MM-DD
 *
 * Retrieve attendance records for teacher's class on specified date.
 */
export async function GET(request: NextRequest) {
  try {
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

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const queryValidation = getAttendanceQuerySchema.safeParse({ date });
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryValidation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Get teacher record to find correct schoolId
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

    // Get attendance data
    const attendanceData = await getAttendanceForDate(
      session.user.id,
      teacher.schoolId,
      queryValidation.data.date
    );

    return NextResponse.json(attendanceData);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch attendance',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/attendance
 *
 * Create new attendance record for a student.
 */
export async function POST(request: NextRequest) {
  try {
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
    const validation = createAttendanceRequestSchema.safeParse(body);

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

    const { studentId, date, status, notes } = validation.data;

    // Verify teacher has permission to access this student
    const hasPermission = await canTeacherAccessStudent(
      session.user.id,
      studentId,
      teacher.schoolId
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Teacher cannot record attendance for this student',
          },
        },
        { status: 403 }
      );
    }

    // Determine appropriate status (handles co-teaching consensus)
    const finalStatus = await determineInitialStatus(
      studentId,
      teacher.schoolId,
      status as AttendanceStatus
    );

    // Create attendance record
    const record = await createAttendance(
      session.user.id,
      teacher.schoolId,
      studentId,
      date,
      finalStatus,
      notes
    );

    // Fetch student details for response
    const attendanceData = await getAttendanceForDate(
      session.user.id,
      teacher.schoolId,
      date
    );

    const createdRecord = attendanceData.attendanceRecords.find(
      (r) => r.id === record.id
    );

    return NextResponse.json(createdRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating attendance:', error);

    // Check for unique constraint violation
    if (error?.code === '23505') {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Attendance record already exists for this student on this date',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create attendance record',
        },
      },
      { status: 500 }
    );
  }
}
