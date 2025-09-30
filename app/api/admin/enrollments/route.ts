import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import { createEnrollmentWithFeeRequestSchema } from '@/lib/validations/fee-validation';
import { formatFeeDisplay } from '@/lib/constants/currency';
import { logAdminAction } from '@/lib/services/access-logging';

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createEnrollmentWithFeeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const requestData = validationResult.data;

    // Create enrollment with fee override
    const enrollment = await EnrollmentService.createEnrollmentWithFee(
      requestData,
      schoolId,
      adminUserId
    );

    // Log the action
    await logAdminAction({
      schoolId,
      adminUserId,
      actionType: 'ENROLLMENT_CREATED',
      targetType: 'ENROLLMENT',
      targetId: enrollment.id,
      details: {
        enrollment_id: enrollment.id,
        child_id: enrollment.childId,
        monthly_fee_override: enrollment.monthlyFeeOverride,
        created_at: new Date().toISOString(),
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
      throw new Error('Failed to retrieve created enrollment');
    }

    // Format response
    const response = {
      id: enrollmentWithFee.enrollment.id,
      childId: enrollmentWithFee.enrollment.childId,
      enrollmentDate: enrollmentWithFee.enrollment.enrollmentDate.toISOString(),
      monthlyFeeOverride: enrollmentWithFee.enrollment.monthlyFeeOverride, // in cents or null
      effectiveFee: enrollmentWithFee.effectiveFee, // in cents
      effectiveFeeDisplay: enrollmentWithFee.effectiveFeeDisplay,
      feeSource: enrollmentWithFee.feeSource,
      notes: enrollmentWithFee.enrollment.notes,
      createdAt: enrollmentWithFee.enrollment.createdAt.toISOString(),
      updatedAt: enrollmentWithFee.enrollment.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating enrollment:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('already has an active enrollment')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
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