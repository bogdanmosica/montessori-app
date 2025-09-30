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
    const enrollmentId = params.id;

    // Get effective fee for enrollment
    const feeResolution = await FeeService.getEffectiveFee(enrollmentId, schoolId);

    if (!feeResolution) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      enrollmentId,
      effectiveFee: feeResolution.effectiveFee, // in cents
      effectiveFeeDisplay: feeResolution.effectiveFeeDisplay,
      feeSource: feeResolution.feeSource,
      childDefaultFee: feeResolution.childDefaultFee, // in cents
      enrollmentOverride: feeResolution.enrollmentOverride, // in cents or null
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching effective fee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}