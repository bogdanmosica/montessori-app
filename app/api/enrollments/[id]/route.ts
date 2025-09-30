import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import { ChildService } from '@/lib/services/child-service';
import {
  updateEnrollmentRequestSchema,
  withdrawEnrollmentRequestSchema,
} from '@/lib/validations/enrollment-validation';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/enrollments/[id]
 * Update enrollment and optionally sync child details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get school ID and admin user ID from session
    const schoolId = session.user.teamId;
    const adminUserId = parseInt(session.user.id);

    if (!schoolId || !adminUserId) {
      return NextResponse.json({ error: 'Session data incomplete' }, { status: 400 });
    }

    const enrollmentId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = updateEnrollmentRequestSchema.parse(body);

    // Update enrollment
    const enrollment = await EnrollmentService.updateEnrollment(
      enrollmentId,
      validatedRequest,
      schoolId,
      adminUserId
    );

    // Update child details if provided
    if (validatedRequest.child && Object.keys(validatedRequest.child).length > 0) {
      await ChildService.updateChildDetails(
        enrollment.child.id,
        validatedRequest.child,
        schoolId
      );

      // Get updated enrollment with child details
      const updatedEnrollment = await EnrollmentService.getEnrollmentById(
        enrollmentId,
        schoolId
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to retrieve updated enrollment');
      }

      return NextResponse.json({
        data: updatedEnrollment,
        message: 'Enrollment and child details updated successfully',
      });
    }

    return NextResponse.json({
      data: enrollment,
      message: 'Enrollment updated successfully',
    });
  } catch (error) {
    console.error(`PUT /api/enrollments/${params.id} error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.format(),
          timestamp: new Date().toISOString(),
          path: `/api/enrollments/${params.id}`,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle business logic errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: `/api/enrollments/${params.id}`,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Cannot modify archived') || error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: `/api/enrollments/${params.id}`,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          timestamp: new Date().toISOString(),
          path: `/api/enrollments/${params.id}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: `/api/enrollments/${params.id}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/enrollments/[id]
 * Remove enrollment (change status to 'withdrawn')
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get school ID and admin user ID from session
    const schoolId = session.user.teamId;
    const adminUserId = parseInt(session.user.id);

    if (!schoolId || !adminUserId) {
      return NextResponse.json({ error: 'Session data incomplete' }, { status: 400 });
    }

    const enrollmentId = params.id;

    // Parse optional request body
    let withdrawalData = {};
    try {
      const body = await request.json();
      withdrawalData = withdrawEnrollmentRequestSchema.parse(body);
    } catch {
      // No body or invalid body - use defaults
    }

    // Withdraw enrollment
    const enrollment = await EnrollmentService.withdrawEnrollment(
      enrollmentId,
      schoolId,
      adminUserId,
      (withdrawalData as any).withdrawalDate,
      (withdrawalData as any).notes
    );

    // In a more complex system, you might archive related records here
    const archivedRecords = 0; // Placeholder

    return NextResponse.json({
      data: enrollment,
      message: 'Enrollment withdrawn successfully',
      archivedRecords,
    });
  } catch (error) {
    console.error(`DELETE /api/enrollments/${params.id} error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.format(),
          timestamp: new Date().toISOString(),
          path: `/api/enrollments/${params.id}`,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle business logic errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: `/api/enrollments/${params.id}`,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('already withdrawn')) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: `/api/enrollments/${params.id}`,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          timestamp: new Date().toISOString(),
          path: `/api/enrollments/${params.id}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: `/api/enrollments/${params.id}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrollments/[id]
 * Get single enrollment by ID with child details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get school ID from session
    const schoolId = session.user.teamId;
    if (!schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }

    const enrollmentId = params.id;

    // Get enrollment
    const enrollment = await EnrollmentService.getEnrollmentById(enrollmentId, schoolId);

    if (!enrollment) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Enrollment not found',
          timestamp: new Date().toISOString(),
          path: `/api/enrollments/${params.id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: enrollment,
    });
  } catch (error) {
    console.error(`GET /api/enrollments/${params.id} error:`, error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: `/api/enrollments/${params.id}`,
      },
      { status: 500 }
    );
  }
}