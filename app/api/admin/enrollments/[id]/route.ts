import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import { updateEnrollmentFeeRequestSchema } from '@/lib/validations/fee-validation';
import { logAdminAction } from '@/lib/services/access-logging';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    // Get school ID from session (multi-tenant scoping)
    const schoolIdRaw = session.user.schoolId || session.user.teamId;
    if (!schoolIdRaw) {
      return NextResponse.json(
        { error: 'School association required' },
        { status: 403 }
      );
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;
    const adminUserId = parseInt(session.user.id);
    const enrollmentId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateEnrollmentFeeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const feeData = validationResult.data;

    // Update enrollment fee override
    const enrollment = await EnrollmentService.updateEnrollmentFee(
      enrollmentId,
      feeData,
      schoolId,
      adminUserId
    );

    // Log the action
    await logAdminAction({
      schoolId,
      adminUserId,
      actionType: 'ENROLLMENT_FEE_UPDATED',
      targetType: 'ENROLLMENT',
      targetId: enrollment.id,
      details: {
        enrollment_id: enrollment.id,
        monthly_fee_override: enrollment.monthlyFeeOverride,
        updated_at: new Date().toISOString(),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Get the enrollment with effective fee
    const enrollmentWithFee = await EnrollmentService.getEnrollmentWithEffectiveFee(
      enrollment.id,
      schoolId
    );

    if (!enrollmentWithFee) {
      throw new Error('Failed to retrieve updated enrollment');
    }

    // Format response
    const response = {
      id: enrollmentWithFee.enrollment.id,
      childId: enrollmentWithFee.enrollment.childId,
      monthlyFeeOverride: enrollmentWithFee.enrollment.monthlyFeeOverride, // in cents or null
      effectiveFee: enrollmentWithFee.effectiveFee, // in cents
      effectiveFeeDisplay: enrollmentWithFee.effectiveFeeDisplay,
      feeSource: enrollmentWithFee.feeSource,
      updatedAt: enrollmentWithFee.enrollment.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error updating enrollment fee:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Invalid fee')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    // Get school ID from session (multi-tenant scoping)
    const schoolIdRaw = session.user.schoolId || session.user.teamId;
    if (!schoolIdRaw) {
      return NextResponse.json(
        { error: 'School association required' },
        { status: 403 }
      );
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;
    const enrollmentId = params.id;

    // Get enrollment with effective fee
    const enrollmentWithFee = await EnrollmentService.getEnrollmentWithEffectiveFee(
      enrollmentId,
      schoolId
    );

    if (!enrollmentWithFee) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      id: enrollmentWithFee.enrollment.id,
      childId: enrollmentWithFee.enrollment.childId,
      child: {
        id: enrollmentWithFee.child.id,
        firstName: enrollmentWithFee.child.firstName,
        lastName: enrollmentWithFee.child.lastName,
        monthlyFee: enrollmentWithFee.child.monthlyFee, // in cents
      },
      enrollmentDate: enrollmentWithFee.enrollment.enrollmentDate.toISOString(),
      monthlyFeeOverride: enrollmentWithFee.enrollment.monthlyFeeOverride, // in cents or null
      effectiveFee: enrollmentWithFee.effectiveFee, // in cents
      effectiveFeeDisplay: enrollmentWithFee.effectiveFeeDisplay,
      feeSource: enrollmentWithFee.feeSource,
      notes: enrollmentWithFee.enrollment.notes,
      createdAt: enrollmentWithFee.enrollment.createdAt.toISOString(),
      updatedAt: enrollmentWithFee.enrollment.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}