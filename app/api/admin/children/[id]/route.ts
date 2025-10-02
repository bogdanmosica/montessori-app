import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { ChildService } from '@/lib/services/child-service';
import { updateChildFeeRequestSchema } from '@/lib/validations/fee-validation';
import { updateChildRequestSchema } from '@/lib/validations/child-validation';
import { formatFeeDisplay } from '@/lib/constants/currency';
import { db } from '@/lib/db';
import { children } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const schoolIdRaw = session.user.schoolId || session.user.teamId;
    if (!schoolIdRaw) {
      return NextResponse.json({ error: 'School association required' }, { status: 403 });
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;
    const childId = params.id;

    // Verify child exists and belongs to school
    const [existingChild] = await db
      .select()
      .from(children)
      .where(and(eq(children.id, childId), eq(children.schoolId, schoolId)))
      .limit(1);

    if (!existingChild) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateChildRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update in transaction
    const result = await db.transaction(async (tx) => {
      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
      if (data.monthlyFee !== undefined) updateData.monthlyFee = data.monthlyFee;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.specialNeeds !== undefined) updateData.specialNeeds = data.specialNeeds;
      if (data.medicalConditions !== undefined)
        updateData.medicalConditions = data.medicalConditions;

      // Update child
      const [updatedChild] = await tx
        .update(children)
        .set(updateData)
        .where(eq(children.id, childId))
        .returning();

      // Log the action
      await logAdminAction(
        {
          schoolId,
          adminUserId: parseInt(session.user.id),
          actionType: 'CHILD_CREATED', // Reusing existing enum value
          targetType: 'CHILD',
          targetId: childId,
          details: {
            action: 'updated',
            fields: Object.keys(data),
          },
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        tx
      );

      return updatedChild;
    });

    return NextResponse.json({
      success: true,
      child: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        dateOfBirth: result.dateOfBirth.toISOString(),
        monthlyFee: result.monthlyFee,
        monthlyFeeDisplay: formatFeeDisplay(result.monthlyFee),
        gender: result.gender,
        startDate: result.startDate.toISOString(),
        specialNeeds: result.specialNeeds,
        medicalConditions: result.medicalConditions,
        enrollmentStatus: result.enrollmentStatus,
      },
    });
  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}