import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { db } from '../../../lib/db/drizzle';
import { users, teams, teamMembers, families } from '../../../lib/db/schema';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UserRole
} from '../../admin/applications/constants';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * POST /api/users
 * Create a new parent user account (extends existing users endpoint for application approval)
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
      role,
      applicationId,
      name,
      email,
      phone,
      password,
      isFromApplication = false,
      sendWelcomeEmail = true,
      parentProfile
    } = requestBody;

    // Validate required fields
    const validationErrors: any[] = [];

    if (!role) {
      validationErrors.push({
        field: 'role',
        message: 'User role is required',
      });
    } else if (role !== 'parent') {
      // Only allow parent role creation through this endpoint for application approval
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROLE_FOR_OPERATION',
            message: ERROR_MESSAGES.INVALID_ROLE_FOR_OPERATION,
          },
        },
        { status: 422 }
      );
    }

    if (!name || name.trim() === '') {
      validationErrors.push({
        field: 'name',
        message: 'Name is required and cannot be empty',
      });
    }

    if (!email || email.trim() === '') {
      validationErrors.push({
        field: 'email',
        message: 'Valid email address is required',
      });
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        validationErrors.push({
          field: 'email',
          message: 'Valid email address is required',
        });
      }
    }

    if (!password || password.length < 8) {
      validationErrors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
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

    // Check if email already exists globally (across all schools)
    const existingUser = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
            details: {
              existingUserId: existingUser[0].id.toString(),
              existingUserRole: existingUser[0].role,
              suggestedAction: 'Use different email or contact existing user',
            },
          },
        },
        { status: 409 }
      );
    }

    // Create user and related records in transaction
    try {
      const result = await db.transaction(async (tx) => {
        // 1. Hash password securely
        const hashedPassword = await bcrypt.hash(password, 12);

        // 2. Create user record
        const newUsers = await tx
          .insert(users)
          .values({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: hashedPassword,
            role: 'parent',
            applicationId: applicationId || null,
            isFromApplication: isFromApplication,
          })
          .returning();

        const newUser = newUsers[0];

        // 3. Add user to team (school) as parent
        await tx
          .insert(teamMembers)
          .values({
            userId: newUser.id,
            teamId: schoolId,
            role: 'parent',
          });

        // 4. Create family record for this parent
        const newFamilies = await tx
          .insert(families)
          .values({
            schoolId: schoolId,
            primaryContactId: newUser.id,
            discountRate: 0,
            totalMonthlyFee: 0,
            paymentStatus: 'current',
          })
          .returning();

        const newFamily = newFamilies[0];

        return {
          user: newUser,
          family: newFamily,
        };
      });

      // TODO: Send welcome email if requested
      const notifications = {
        welcomeEmailSent: sendWelcomeEmail,
        passwordResetRequired: true, // Always require password reset for application-created accounts
      };

      // Prepare response user object (excluding sensitive data)
      const responseUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: phone || null,
        role: result.user.role,
        isFromApplication: result.user.isFromApplication,
        applicationId: result.user.applicationId,
        schoolId: schoolId,
        parentProfile: parentProfile || null,
        isActive: true, // Default for new users
        emailVerified: false, // Needs verification
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
        lastLoginAt: null,
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            user: responseUser,
            notifications,
          },
          message: SUCCESS_MESSAGES.PARENT_CREATED,
        },
        { status: 201 }
      );

    } catch (transactionError) {
      console.error('Transaction failed during user creation:', transactionError);

      // Check for specific constraint violations
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('email') && transactionError.message.includes('unique')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'EMAIL_ALREADY_EXISTS',
                message: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
                details: {
                  suggestedAction: 'Use different email address',
                },
              },
            },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRANSACTION_FAILED',
            message: 'Failed to create user account. Changes have been rolled back.',
            details: {
              step: 'user_creation',
              reason: 'Database transaction failed',
            },
          },
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating user account:', error);

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
 * Validate parent profile structure
 */
function validateParentProfile(parentProfile: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (parentProfile && typeof parentProfile === 'object') {
    // Validate address
    if (parentProfile.address) {
      const address = parentProfile.address;
      if (typeof address !== 'object') {
        errors.push('Parent profile address must be an object');
      } else {
        if (address.street && typeof address.street !== 'string') {
          errors.push('Address street must be a string');
        }
        if (address.city && typeof address.city !== 'string') {
          errors.push('Address city must be a string');
        }
        if (address.state && typeof address.state !== 'string') {
          errors.push('Address state must be a string');
        }
        if (address.zipCode && typeof address.zipCode !== 'string') {
          errors.push('Address zip code must be a string');
        }
      }
    }

    // Validate occupation
    if (parentProfile.occupation && typeof parentProfile.occupation !== 'string') {
      errors.push('Occupation must be a string');
    }

    // Validate emergency contact
    if (parentProfile.emergencyContact) {
      const contact = parentProfile.emergencyContact;
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

/**
 * Send welcome email notification (placeholder)
 */
async function sendWelcomeEmail(
  user: { name: string; email: string },
  isFromApplication: boolean
): Promise<boolean> {
  // TODO: Implement actual email sending
  // This would integrate with your email service (SendGrid, AWS SES, etc.)

  console.log(`Welcome email would be sent to ${user.email} for ${user.name}`);
  console.log(`User created from application: ${isFromApplication}`);

  // Return true for now (mock success)
  return true;
}