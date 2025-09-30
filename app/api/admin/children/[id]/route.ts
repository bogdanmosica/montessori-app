import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { ChildService } from '@/lib/services/child-service';
import { updateChildFeeRequestSchema } from '@/lib/validations/fee-validation';
import { formatFeeDisplay } from '@/lib/constants/currency';

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
    const childId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateChildFeeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { monthlyFee } = validationResult.data;

    // Update child fee
    const updatedChild = await ChildService.updateChildFee(
      childId,
      monthlyFee || 0,
      schoolId
    );

    // Format response
    const response = {
      id: updatedChild.id,
      firstName: updatedChild.firstName,
      lastName: updatedChild.lastName,
      monthlyFee: updatedChild.monthlyFee, // in cents
      monthlyFeeDisplay: formatFeeDisplay(updatedChild.monthlyFee),
      updatedAt: updatedChild.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error updating child fee:', error);

    if (error instanceof Error) {
      if (error.message.includes('Child not found')) {
        return NextResponse.json(
          { error: 'Child not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Invalid fee amount')) {
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
    const childId = params.id;

    // Get child with fee display
    const child = await ChildService.getChildWithFeeDisplay(childId, schoolId);

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth.toISOString().split('T')[0],
      monthlyFee: child.monthlyFee, // in cents
      monthlyFeeDisplay: child.monthlyFeeDisplay,
      gender: child.gender,
      enrollmentStatus: child.enrollmentStatus,
      startDate: child.startDate.toISOString().split('T')[0],
      specialNeeds: child.specialNeeds,
      medicalConditions: child.medicalConditions,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching child:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}