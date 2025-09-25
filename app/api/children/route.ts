import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { db } from '../../../lib/db/drizzle';
import { users, children, families } from '../../../lib/db/schema';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../../admin/applications/constants';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/children
 * Create a new child record (used during application approval process)
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    const {
      parentId,
      applicationId,
      name,
      dateOfBirth,
      gender,
      enrollmentStatus = 'enrolled',
      medicalInfo,
      notes
    } = requestBody;

    // Validate required fields
    const validationErrors: any[] = [];

    if (!parentId) {
      validationErrors.push({
        field: 'parentId',
        message: 'Parent ID is required',
      });
    }

    if (!name || name.trim() === '') {
      validationErrors.push({
        field: 'name',
        message: 'Name is required and cannot be empty',
      });
    }

    if (!dateOfBirth) {
      validationErrors.push({
        field: 'dateOfBirth',
        message: 'Date of birth is required',
      });
    } else {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        validationErrors.push({
          field: 'dateOfBirth',
          message: 'Date of birth must be a valid date',
        });
      } else if (birthDate > new Date()) {
        validationErrors.push({
          field: 'dateOfBirth',
          message: 'Date of birth cannot be in the future',
        });
      }
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      validationErrors.push({
        field: 'gender',
        message: 'Gender must be one of: male, female, other',
      });
    }

    if (enrollmentStatus && !['enrolled', 'pending', 'inactive'].includes(enrollmentStatus)) {
      validationErrors.push({
        field: 'enrollmentStatus',
        message: 'Enrollment status must be one of: enrolled, pending, inactive',
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            details: validationErrors,
          },
        },
        { status: 400 }
      );
    }

    // Verify parent exists and belongs to the same school
    const parentUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .innerJoin(families, eq(users.id, families.primaryContactId))
      .where(
        and(
          eq(users.id, parentId),
          eq(families.schoolId, schoolId),
          eq(users.role, 'parent')
        )
      )
      .limit(1);

    if (parentUser.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: ERROR_MESSAGES.PARENT_NOT_FOUND,
          },
        },
        { status: 404 }
      );
    }

    // Get the family record for this parent
    const familyRecord = await db
      .select({ id: families.id })
      .from(families)
      .where(
        and(
          eq(families.primaryContactId, parentId),
          eq(families.schoolId, schoolId)
        )
      )
      .limit(1);

    if (familyRecord.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent family record not found',
          },
        },
        { status: 404 }
      );
    }

    const familyId = familyRecord[0].id;

    // Check for duplicate child (same name + DOB + parent)
    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const existingChild = await db
      .select({ id: children.id })
      .from(children)
      .where(
        and(
          eq(children.familyId, familyId),
          eq(children.firstName, firstName),
          eq(children.lastName, lastName),
          eq(children.dateOfBirth, new Date(dateOfBirth))
        )
      )
      .limit(1);

    if (existingChild.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHILD_ALREADY_EXISTS',
            message: ERROR_MESSAGES.CHILD_ALREADY_EXISTS,
            details: {
              existingChildId: existingChild[0].id,
            },
          },
        },
        { status: 409 }
      );
    }

    // Create child record
    try {
      const newChildren = await db
        .insert(children)
        .values({
          familyId: familyId,
          firstName: firstName,
          lastName: lastName,
          dateOfBirth: new Date(dateOfBirth),
          enrollmentStatus: enrollmentStatus as 'enrolled' | 'pending' | 'waitlisted' | 'withdrawn',
          monthlyFee: 0, // Default fee, can be updated later
          applicationId: applicationId || null,
        })
        .returning();

      const newChild = newChildren[0];

      // TODO: Store medical info in a separate medical_info table or as JSON
      // For now, we'll add it to the response but it's not stored in the main children table

      const responseChild = {
        id: newChild.id,
        parentId: parentId,
        applicationId: applicationId || null,
        name: `${newChild.firstName} ${newChild.lastName}`,
        dateOfBirth: dateOfBirth,
        gender: gender || null,
        enrollmentStatus: newChild.enrollmentStatus,
        medicalInfo: medicalInfo || null,
        notes: notes || null,
        createdAt: newChild.createdAt,
        updatedAt: newChild.updatedAt,
        schoolId: schoolId,
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            child: responseChild,
          },
          message: SUCCESS_MESSAGES.CHILD_CREATED,
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error('Database error creating child:', dbError);

      // Check for constraint violations
      if (dbError instanceof Error && dbError.message.includes('constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONSTRAINT_VIOLATION',
              message: 'Database constraint violation during child creation',
            },
          },
          { status: 409 }
        );
      }

      throw dbError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('Error creating child record:', error);

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
 * Validate medical information structure
 */
function validateMedicalInfo(medicalInfo: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (medicalInfo && typeof medicalInfo === 'object') {
    // Validate allergies array
    if (medicalInfo.allergies && !Array.isArray(medicalInfo.allergies)) {
      errors.push('Medical info allergies must be an array');
    }

    // Validate medications array
    if (medicalInfo.medications && !Array.isArray(medicalInfo.medications)) {
      errors.push('Medical info medications must be an array');
    }

    // Validate emergency contact
    if (medicalInfo.emergencyContact) {
      const contact = medicalInfo.emergencyContact;
      if (typeof contact !== 'object') {
        errors.push('Emergency contact must be an object');
      } else {
        if (contact.name && typeof contact.name !== 'string') {
          errors.push('Emergency contact name must be a string');
        }
        if (contact.phone && typeof contact.phone !== 'string') {
          errors.push('Emergency contact phone must be a string');
        }
        if (contact.relationship && typeof contact.relationship !== 'string') {
          errors.push('Emergency contact relationship must be a string');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}