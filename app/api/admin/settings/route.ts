import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { SettingsService } from '@/lib/services/settings-service';
import {
  settingsUpdateRequestSchema,
  type SettingsUpdateRequest,
  type SettingsResponse,
  type SettingsUpdateResponse,
} from '@/lib/validations/settings-schema';
import {
  handleSettingsError,
  UnauthorizedError,
  SchoolNotFoundError,
  ValidationError,
  validateFeeBusinessRules,
  validateEnrollmentCountBusinessRules,
  validateCapacityBusinessRules,
} from '@/lib/errors/settings-errors';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';

/**
 * GET /api/admin/settings
 * Retrieve current school settings for admin's school
 * Requires: Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { user } = session;

    // Verify admin permissions
    try {
      requireAdminPermissions(user.role);
    } catch (error) {
      throw new UnauthorizedError('Admin role required');
    }

    // Get school ID from user session
    const schoolIdRaw = user.schoolId;
    if (!schoolIdRaw) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'School affiliation required',
          code: 'SCHOOL_REQUIRED',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;

    // Fetch settings
    const settings = await SettingsService.getSettings(schoolId);

    if (!settings) {
      throw new SchoolNotFoundError();
    }

    // Format response
    const response: SettingsResponse = {
      success: true,
      data: {
        school_id: schoolId.toString(),
        default_monthly_fee_ron: parseFloat(settings.defaultMonthlyFeeRon),
        free_enrollment_count: settings.freeEnrollmentCount,
        maximum_capacity: settings.maximumCapacity,
        age_group_capacities: settings.ageGroupCapacities,
        settings_updated_at: settings.settingsUpdatedAt?.toISOString() ?? null,
        updated_by_admin: user.name ?? null,
      },
    };

    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': schoolId.toString(),
      'X-Request-Id': crypto.randomUUID(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers,
    });
  } catch (error) {
    const { response, statusCode } = handleSettingsError(error);
    return NextResponse.json(response, { status: statusCode });
  }
}

/**
 * PUT /api/admin/settings
 * Update school settings for admin's school
 * Requires: Admin role
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { user } = session;

    // Verify admin permissions
    try {
      requireAdminPermissions(user.role);
    } catch (error) {
      throw new UnauthorizedError('Admin role required');
    }

    // Get school ID from user session
    const schoolIdRaw = user.schoolId;
    if (!schoolIdRaw) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'School affiliation required',
          code: 'SCHOOL_REQUIRED',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;

    // Get user ID
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid user ID',
          code: 'INVALID_USER_ID',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate request data
    const validationResult = settingsUpdateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      throw new ValidationError('Validation failed', errors);
    }

    const updateData: SettingsUpdateRequest = validationResult.data;

    // Additional business logic validation
    validateFeeBusinessRules(updateData.default_monthly_fee_ron);
    validateEnrollmentCountBusinessRules(updateData.free_enrollment_count);
    validateCapacityBusinessRules(updateData.maximum_capacity);

    // Verify school exists
    const schoolExists = await SettingsService.verifySchoolExists(schoolId);
    if (!schoolExists) {
      throw new SchoolNotFoundError('School not found');
    }

    // Update settings
    const updatedSettings = await SettingsService.updateSettings(
      schoolId,
      updateData,
      userId
    );

    // Format response
    const response: SettingsUpdateResponse = {
      success: true,
      data: {
        school_id: schoolId.toString(),
        default_monthly_fee_ron: parseFloat(updatedSettings.defaultMonthlyFeeRon),
        free_enrollment_count: updatedSettings.freeEnrollmentCount,
        maximum_capacity: updatedSettings.maximumCapacity,
        age_group_capacities: updatedSettings.ageGroupCapacities,
        settings_updated_at: updatedSettings.settingsUpdatedAt?.toISOString() ?? new Date().toISOString(),
        updated_by_admin: user.name ?? 'Admin',
      },
      message: 'Settings updated successfully',
    };

    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': schoolId.toString(),
      'X-Request-Id': crypto.randomUUID(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers,
    });
  } catch (error) {
    const { response, statusCode } = handleSettingsError(error);
    return NextResponse.json(response, { status: statusCode });
  }
}