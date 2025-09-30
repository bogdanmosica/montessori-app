import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { FeeService } from '@/lib/services/fee-service';

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
    const childId = params.id;

    // Get child fee details including all enrollment overrides
    const feeDetails = await FeeService.getChildFeeDetails(childId, schoolId);

    if (!feeDetails) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      childId: feeDetails.childId,
      defaultFee: feeDetails.defaultFee, // in cents
      defaultFeeDisplay: feeDetails.defaultFeeDisplay,
      enrollments: feeDetails.enrollments.map(enrollment => ({
        id: enrollment.id,
        monthlyFeeOverride: enrollment.monthlyFeeOverride, // in cents or null
        effectiveFee: enrollment.effectiveFee, // in cents
        effectiveFeeDisplay: enrollment.effectiveFeeDisplay,
        feeSource: enrollment.feeSource,
      })),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching child fee details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}