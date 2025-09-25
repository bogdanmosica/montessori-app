import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import {
  getApplicationsList,
  buildPagination,
  buildFilters
} from '../../../lib/db/queries/applications';
import {
  ERROR_MESSAGES,
  PERFORMANCE
} from '../../admin/applications/constants';

/**
 * GET /api/applications
 * Retrieve paginated list of school applications with filtering and search capabilities
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate and authorize user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
        },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
          },
        },
        { status: 403 }
      );
    }

    // Get school ID from user session (multi-tenant scoping)
    const schoolIdStr = session.user.schoolId;
    if (!schoolIdStr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SCHOOL_CONTEXT',
            message: 'User is not associated with a school',
          },
        },
        { status: 400 }
      );
    }

    const schoolId = parseInt(schoolIdStr);

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Validate and build pagination
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    try {
      const pagination = buildPagination(page, limit);

      // Additional validation for limit
      if (pagination.limit > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: [
                {
                  field: 'limit',
                  message: 'Limit must be between 1 and 100',
                },
              ],
            },
          },
          { status: 400 }
        );
      }

      // Validate and build filters
      const filters = buildFilters(searchParams);

      // Validate status filter
      const status = searchParams.get('status');
      if (status && !['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: [
                {
                  field: 'status',
                  message: 'Status must be one of: pending, approved, rejected',
                },
              ],
            },
          },
          { status: 400 }
        );
      }

      // Validate sortBy parameter
      const sortBy = searchParams.get('sortBy');
      if (sortBy && !['createdAt', 'parentName', 'childName'].includes(sortBy)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: [
                {
                  field: 'sortBy',
                  message: 'SortBy must be one of: createdAt, parentName, childName',
                },
              ],
            },
          },
          { status: 400 }
        );
      }

      // Validate sortOrder parameter
      const sortOrder = searchParams.get('sortOrder');
      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: [
                {
                  field: 'sortOrder',
                  message: 'SortOrder must be one of: asc, desc',
                },
              ],
            },
          },
          { status: 400 }
        );
      }

      // Get applications list from database
      const result = await getApplicationsList(schoolId, filters, pagination);

      // Check performance requirement
      const responseTime = Date.now() - startTime;
      if (responseTime > PERFORMANCE.MAX_RESPONSE_TIME_MS) {
        console.warn(`Applications list query took ${responseTime}ms, exceeds target of ${PERFORMANCE.MAX_RESPONSE_TIME_MS}ms`);
      }

      // Return successful response
      return NextResponse.json(
        {
          success: true,
          data: {
            applications: result.applications,
            pagination: result.pagination,
            filters: result.filters,
          },
        },
        {
          status: 200,
          headers: {
            'Cache-Control': `private, max-age=${PERFORMANCE.CACHE_DURATION_MINUTES * 60}`,
          },
        }
      );

    } catch (validationError) {
      // Handle validation errors
      console.error('Validation error in applications list:', validationError);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            details: [
              {
                field: 'query_parameters',
                message: 'Invalid query parameters provided',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

  } catch (error) {
    // Handle unexpected database or system errors
    console.error('Error fetching applications list:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting middleware (placeholder)
 * In production, this should be implemented with Redis or similar
 */
function checkRateLimit(userId: string): boolean {
  // TODO: Implement proper rate limiting
  // For now, return true (allow all requests)
  return true;
}

/**
 * Validate user permissions for accessing applications
 */
function validateUserPermissions(user: any): { valid: boolean; error?: string } {
  if (!user.schoolId) {
    return {
      valid: false,
      error: 'User must be associated with a school to access applications',
    };
  }

  if (!['admin', 'SUPER_ADMIN'].includes(user.role)) {
    return {
      valid: false,
      error: 'Only admin users can access applications',
    };
  }

  return { valid: true };
}