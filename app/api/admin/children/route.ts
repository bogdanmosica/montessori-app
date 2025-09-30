import { NextRequest, NextResponse } from 'next/server';
import { createChildProfile, validateChildData } from '@/lib/services/child-profile-creation';
import { findOrCreateParentProfile, validateParentData } from '@/lib/services/parent-profile-matching';
import { logAdminAction } from '@/lib/services/access-logging';
import { db } from '@/lib/db/drizzle';
import { parentChildRelationships } from '@/lib/db/schema';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { ronToCents, isValidFeeAmount, formatFeeDisplay } from '@/lib/constants/currency';
import { validateFeeAmount } from '@/lib/validations/fee-validation';

interface CreateChildRequest {
  child: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    monthly_fee?: number; // Optional fee in RON
    gender?: string;
    start_date: string;
    special_needs?: string;
    medical_conditions?: string;
  };
  parents: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    relationship_type: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';
    primary_contact?: boolean;
    pickup_authorized?: boolean;
  }>;
}

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

    // Parse request body
    const requestData: CreateChildRequest = await request.json();

    // Validate request structure
    if (!requestData.child || !requestData.parents) {
      return NextResponse.json(
        { error: 'Child and parents data are required' },
        { status: 400 }
      );
    }

    // Validate parents array
    if (!Array.isArray(requestData.parents) || requestData.parents.length === 0) {
      return NextResponse.json(
        { error: 'At least one parent is required' },
        { status: 400 }
      );
    }

    if (requestData.parents.length > 2) {
      return NextResponse.json(
        { error: 'Maximum 2 parents allowed per child' },
        { status: 400 }
      );
    }

    // Validate and process monthly fee
    let monthlyFeeCents = 0; // Default to free
    if (requestData.child.monthly_fee !== undefined) {
      const feeValidation = validateFeeAmount(requestData.child.monthly_fee);
      if (!feeValidation.valid) {
        return NextResponse.json(
          { error: feeValidation.error },
          { status: 400 }
        );
      }
      monthlyFeeCents = ronToCents(requestData.child.monthly_fee);
    }

    // Validate child data
    const childData = {
      schoolId: schoolId,
      firstName: requestData.child.first_name,
      lastName: requestData.child.last_name,
      dateOfBirth: new Date(requestData.child.date_of_birth),
      monthlyFee: monthlyFeeCents,
      gender: requestData.child.gender,
      startDate: new Date(requestData.child.start_date),
      specialNeeds: requestData.child.special_needs,
      medicalConditions: requestData.child.medical_conditions,
      enrollmentStatus: 'ACTIVE' as const,
      createdByAdminId: parseInt(session.user.id),
    };

    const childValidationErrors = validateChildData(childData);
    if (childValidationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Child data validation failed', details: childValidationErrors },
        { status: 400 }
      );
    }

    // Validate parent data
    for (let i = 0; i < requestData.parents.length; i++) {
      const parent = requestData.parents[i];
      const parentData = {
        schoolId: schoolId,
        firstName: parent.first_name,
        lastName: parent.last_name,
        email: parent.email,
        phone: parent.phone,
      };

      const parentValidationErrors = validateParentData(parentData);
      if (parentValidationErrors.length > 0) {
        return NextResponse.json(
          { error: `Parent ${i + 1} validation failed`, details: parentValidationErrors },
          { status: 400 }
        );
      }
    }

    // Create child and parent profiles in transaction
    const result = await db.transaction(async (tx) => {
      // Create child profile
      const childProfile = await createChildProfile(childData, tx);

      // Create/link parent profiles and relationships
      const createdParentProfiles = [];
      for (const parentData of requestData.parents) {
        const parentProfile = await findOrCreateParentProfile(
          {
            schoolId: schoolId,
            firstName: parentData.first_name,
            lastName: parentData.last_name,
            email: parentData.email,
            phone: parentData.phone,
          },
          tx
        );

        // Create parent-child relationship
        await tx.insert(parentChildRelationships).values({
          schoolId: schoolId,
          parentId: parentProfile.id,
          childId: childProfile.id,
          relationshipType: parentData.relationship_type,
          primaryContact: parentData.primary_contact || false,
          pickupAuthorized: parentData.pickup_authorized !== false,
        });

        createdParentProfiles.push({
          ...parentProfile,
          relationship_to_child: parentData.relationship_type,
          primary_contact: parentData.primary_contact || false,
          pickup_authorized: parentData.pickup_authorized !== false,
        });
      }

      // Log the action
      const accessLog = await logAdminAction({
        schoolId: schoolId,
        adminUserId: parseInt(session.user.id),
        actionType: 'CHILD_CREATED',
        targetType: 'CHILD',
        targetId: childProfile.id,
        details: {
          child_profile_id: childProfile.id,
          parent_profile_ids: createdParentProfiles.map(p => p.id),
          created_at: new Date().toISOString(),
          direct_creation: true, // not from application
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }, tx);

      return {
        childProfile,
        createdParentProfiles,
        accessLog,
      };
    });

    // Format response
    const response = {
      child_profile: {
        id: result.childProfile.id,
        application_id: null, // direct creation, no application
        first_name: result.childProfile.firstName,
        last_name: result.childProfile.lastName,
        date_of_birth: result.childProfile.dateOfBirth.toISOString().split('T')[0],
        monthly_fee: result.childProfile.monthlyFee, // in cents
        monthly_fee_display: formatFeeDisplay(result.childProfile.monthlyFee),
        gender: result.childProfile.gender,
        enrollment_status: result.childProfile.enrollmentStatus,
        start_date: result.childProfile.startDate.toISOString().split('T')[0],
        special_needs: result.childProfile.specialNeeds,
        medical_conditions: result.childProfile.medicalConditions,
        created_at: result.childProfile.createdAt.toISOString(),
        created_by_admin_id: session.user.id,
      },
      parent_profiles: result.createdParentProfiles.map(p => ({
        id: p.id,
        first_name: p.firstName,
        last_name: p.lastName,
        email: p.email,
        phone: p.phone,
        address: p.address,
        emergency_contact: p.emergencyContact,
        relationship_to_child: p.relationship_to_child,
        primary_contact: p.primary_contact,
        pickup_authorized: p.pickup_authorized,
        created_at: p.createdAt.toISOString(),
      })),
      access_log: {
        id: result.accessLog.id,
        action_type: result.accessLog.actionType,
        target_type: result.accessLog.targetType,
        target_id: result.accessLog.targetId,
        details: JSON.parse(result.accessLog.details || '{}'),
        timestamp: result.accessLog.timestamp.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating child profile:', error);

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Handle date parsing errors
      if (error.message.includes('Invalid Date') || error.message.includes('date')) {
        return NextResponse.json(
          { error: 'Invalid date format provided' },
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