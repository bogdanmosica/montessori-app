import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import { ChildService } from '@/lib/services/child-service';
import {
  createEnrollmentRequestSchema,
  getEnrollmentsQuerySchema,
} from '@/lib/validations/enrollment-validation';
import { z } from 'zod';

/**
 * GET /api/enrollments
 * List enrollments with filtering, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get school ID from session (assuming it's stored in user session)
    const schoolId = session.user.teamId;
    if (!schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    // Handle multiple status values
    if (queryParams.status && queryParams.status.includes(',')) {
      (queryParams as any).status = queryParams.status.split(',');
    }

    const validatedQuery = getEnrollmentsQuerySchema.parse(queryParams);

    // Get enrollments
    const response = await EnrollmentService.getEnrollments(schoolId, validatedQuery);

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/enrollments error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.format(),
          timestamp: new Date().toISOString(),
          path: '/api/enrollments',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: '/api/enrollments',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enrollments
 * Create new enrollment (with new or existing child)
 */
export async function POST(request: NextRequest) {
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
    const adminUserId = session.user.id;

    if (!schoolId || !adminUserId) {
      return NextResponse.json({ error: 'Session data incomplete' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = createEnrollmentRequestSchema.parse(body);

    let enrollment;

    // Check if we're using an existing child or creating a new one
    if ('existingChildId' in validatedRequest.child) {
      // Create enrollment with existing child
      enrollment = await EnrollmentService.createEnrollment(
        validatedRequest,
        schoolId,
        Number(adminUserId)
      );
    } else {
      // Create child first, then enrollment
      const newChild = await ChildService.createChildFromEnrollment(
        validatedRequest.child,
        schoolId,
        Number(adminUserId)
      );

      // Update request to use new child ID
      const enrollmentRequest = {
        ...validatedRequest,
        child: { existingChildId: newChild.id },
      };

      enrollment = await EnrollmentService.createEnrollment(
        enrollmentRequest,
        schoolId,
        Number(adminUserId)
      );
    }

    return NextResponse.json(
      {
        data: enrollment,
        message: 'Enrollment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/enrollments error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.format(),
          timestamp: new Date().toISOString(),
          path: '/api/enrollments',
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle business logic errors
      if (error.message.includes('already has an active enrollment')) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: '/api/enrollments',
          },
          { status: 409 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: '/api/enrollments',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          timestamp: new Date().toISOString(),
          path: '/api/enrollments',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: '/api/enrollments',
      },
      { status: 500 }
    );
  }
}