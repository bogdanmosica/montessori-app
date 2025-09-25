import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { db } from '../../../../lib/db/drizzle';
import {
  validateApplicationForProcessing,
  updateApplicationStatus
} from '../../../../lib/db/queries/applications';
import { applicationsNew } from '../../../../lib/db/schema/applications';
import { users, children, families } from '../../../../lib/db/schema';
import { enrollments } from '../../../../lib/db/schema/enrollments';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  EnrollmentStatus
} from '../../../admin/applications/constants';
import {
  acquireProcessingLock,
  releaseProcessingLock,
  isApplicationLocked
} from '../../../../lib/utils/application-locks';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/enrollment
 * Approve or reject a school application, creating parent/child records on approval
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
    const adminUserId = parseInt(session.user.id);

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

    const { applicationId, action } = requestBody;

    // Validate required fields
    if (!applicationId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            details: [
              ...(!applicationId ? [{
                field: 'applicationId',
                message: 'Application ID is required',
              }] : []),
              ...(!action ? [{
                field: 'action',
                message: 'Action is required (approve or reject)',
              }] : []),
            ],
          },
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            details: [
              {
                field: 'action',
                message: 'Action must be either "approve" or "reject"',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // Check if application is currently being processed by another admin
    const lockStatus = isApplicationLocked(applicationId);
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLICATION_LOCKED',
            message: 'This application is currently being processed by another administrator.',
            details: {
              lockedBy: lockStatus.lock?.userName,
              lockedSince: lockStatus.lock?.lockedAt,
              action: lockStatus.lock?.action,
            },
          },
        },
        { status: 423 } // 423 Locked
      );
    }

    // Acquire processing lock
    const lockResult = acquireProcessingLock(
      applicationId,
      adminUserId,
      session.user.name || session.user.email,
      action as 'approve' | 'reject'
    );

    if (!lockResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOCK_ACQUISITION_FAILED',
            message: lockResult.error || 'Failed to acquire processing lock',
            details: lockResult.currentLock ? {
              lockedBy: lockResult.currentLock.userName,
              lockedSince: lockResult.currentLock.lockedAt,
              action: lockResult.currentLock.action,
            } : undefined,
          },
        },
        { status: 423 } // 423 Locked
      );
    }

    // Validate and get application
    const validation = await validateApplicationForProcessing(applicationId, schoolId);
    if (!validation.valid) {
      // Release lock on validation failure
      releaseProcessingLock(applicationId, adminUserId);

      if (validation.error === 'Application not found or not accessible') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'APPLICATION_NOT_FOUND',
              message: ERROR_MESSAGES.APPLICATION_NOT_FOUND,
            },
          },
          { status: 404 }
        );
      }

      if (validation.error === 'Application has already been processed') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'APPLICATION_ALREADY_PROCESSED',
              message: ERROR_MESSAGES.APPLICATION_ALREADY_PROCESSED,
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error || 'Application validation failed',
          },
        },
        { status: 400 }
      );
    }

    const application = validation.application!;

    // Handle rejection
    if (action === 'reject') {
      const { rejectionReason, notifyParent = true, notes } = requestBody;

      if (!rejectionReason) {
        // Release lock on validation error
        releaseProcessingLock(applicationId, adminUserId);

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: [
                {
                  field: 'rejectionReason',
                  message: 'Rejection reason is required',
                },
              ],
            },
          },
          { status: 400 }
        );
      }

      // Update application status to rejected
      const updatedApplication = await updateApplicationStatus(
        applicationId,
        schoolId,
        'rejected',
        adminUserId.toString(),
        rejectionReason,
        notes
      );

      if (!updatedApplication) {
        // Release lock on failure
        releaseProcessingLock(applicationId, adminUserId);
        throw new Error('Failed to update application status');
      }

      // Release processing lock after successful rejection
      releaseProcessingLock(applicationId, adminUserId);

      // TODO: Send notification email to parent if notifyParent is true
      const notifications = {
        parentNotified: notifyParent,
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            application: {
              id: updatedApplication.id,
              status: updatedApplication.status,
              rejectionReason: updatedApplication.rejectionReason,
              rejectedAt: updatedApplication.rejectedAt,
              rejectedBy: updatedApplication.rejectedBy,
            },
            notifications,
          },
          message: SUCCESS_MESSAGES.APPLICATION_REJECTED,
        },
        { status: 200 }
      );
    }

    // Handle approval - this requires atomic transaction
    if (action === 'approve') {
      const {
        parentData,
        childData,
        enrollmentData,
        notes
      } = requestBody;

      // Validate required data for approval
      const validationErrors: any[] = [];

      if (!parentData) {
        validationErrors.push({
          field: 'parentData',
          message: 'Parent data is required for approval',
        });
      } else {
        if (!parentData.name) {
          validationErrors.push({
            field: 'parentData.name',
            message: 'Parent name is required',
          });
        }
        if (!parentData.email) {
          validationErrors.push({
            field: 'parentData.email',
            message: 'Parent email is required',
          });
        }
        if (!parentData.password) {
          validationErrors.push({
            field: 'parentData.password',
            message: 'Parent password is required',
          });
        } else if (parentData.password.length < 8) {
          validationErrors.push({
            field: 'parentData.password',
            message: 'Password must be at least 8 characters long',
          });
        }
      }

      if (!childData) {
        validationErrors.push({
          field: 'childData',
          message: 'Child data is required for approval',
        });
      } else {
        if (!childData.name) {
          validationErrors.push({
            field: 'childData.name',
            message: 'Child name is required',
          });
        }
        if (!childData.dateOfBirth) {
          validationErrors.push({
            field: 'childData.dateOfBirth',
            message: 'Child date of birth is required',
          });
        } else {
          const birthDate = new Date(childData.dateOfBirth);
          if (birthDate > new Date()) {
            validationErrors.push({
              field: 'childData.dateOfBirth',
              message: 'Date of birth cannot be in the future',
            });
          }
        }
      }

      if (!enrollmentData) {
        validationErrors.push({
          field: 'enrollmentData',
          message: 'Enrollment data is required for approval',
        });
      }

      if (validationErrors.length > 0) {
        // Release lock on validation error
        releaseProcessingLock(applicationId, adminUserId);

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

      // Check if parent email already exists
      const existingUser = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, parentData.email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        // Release lock on email conflict
        releaseProcessingLock(applicationId, adminUserId);

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PARENT_EMAIL_EXISTS',
              message: ERROR_MESSAGES.PARENT_EMAIL_EXISTS,
              details: {
                existingUserId: existingUser[0].id.toString(),
                existingUserRole: existingUser[0].role,
                suggestedAction: 'Use different email or contact existing user',
              },
            },
          },
          { status: 422 }
        );
      }

      // Execute atomic transaction for approval
      try {
        const result = await db.transaction(async (tx) => {
          // 1. Create parent user
          const hashedPassword = await bcrypt.hash(parentData.password, 12);

          const newParents = await tx
            .insert(users)
            .values({
              name: parentData.name,
              email: parentData.email.toLowerCase(),
              passwordHash: hashedPassword,
              role: 'parent',
              applicationId: applicationId,
              isFromApplication: true,
            })
            .returning();

          const newParent = newParents[0];

          // 2. Create family record (required for children table)
          const newFamilies = await tx
            .insert(families)
            .values({
              schoolId: schoolId,
              primaryContactId: newParent.id,
              discountRate: 0,
              totalMonthlyFee: 0,
              paymentStatus: 'current',
            })
            .returning();

          const newFamily = newFamilies[0];

          // 3. Create child record
          const [firstName, ...lastNameParts] = childData.name.split(' ');
          const lastName = lastNameParts.join(' ') || firstName;

          const newChildren = await tx
            .insert(children)
            .values({
              familyId: newFamily.id,
              firstName: firstName,
              lastName: lastName,
              dateOfBirth: new Date(childData.dateOfBirth),
              enrollmentStatus: 'enrolled',
              monthlyFee: 0, // Default fee
              applicationId: applicationId,
            })
            .returning();

          const newChild = newChildren[0];

          // 4. Create enrollment record
          const newEnrollments = await tx
            .insert(enrollments)
            .values({
              schoolId: schoolId,
              applicationId: applicationId,
              parentId: newParent.id,
              childId: newChild.id,
              programId: enrollmentData.programId || null,
              status: EnrollmentStatus.ACTIVE,
              startDate: enrollmentData.startDate || null,
            })
            .returning();

          const newEnrollment = newEnrollments[0];

          // 5. Update application status
          const updatedApplications = await tx
            .update(applicationsNew)
            .set({
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: adminUserId,
              notes: notes,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(applicationsNew.id, applicationId),
                eq(applicationsNew.schoolId, schoolId)
              )
            )
            .returning();

          const updatedApplication = updatedApplications[0];

          return {
            application: updatedApplication,
            parent: newParent,
            child: newChild,
            enrollment: newEnrollment,
          };
        });

        // Release processing lock after successful approval
        releaseProcessingLock(applicationId, adminUserId);

        // TODO: Send welcome email if requested
        const notifications = {
          welcomeEmailSent: parentData.sendWelcomeEmail || true,
          parentNotified: true,
        };

        return NextResponse.json(
          {
            success: true,
            data: {
              application: {
                id: result.application.id,
                status: result.application.status,
                approvedAt: result.application.approvedAt,
                approvedBy: result.application.approvedBy,
              },
              parentUser: {
                id: result.parent.id,
                name: result.parent.name,
                email: result.parent.email,
                role: result.parent.role,
                isFromApplication: result.parent.isFromApplication,
                createdAt: result.parent.createdAt,
              },
              child: {
                id: result.child.id,
                name: `${result.child.firstName} ${result.child.lastName}`,
                parentId: result.parent.id,
                dateOfBirth: childData.dateOfBirth,
                enrollmentStatus: 'enrolled',
                createdAt: result.child.createdAt,
              },
              enrollment: {
                id: result.enrollment.id,
                childId: result.child.id,
                parentId: result.parent.id,
                programId: result.enrollment.programId,
                status: result.enrollment.status,
                startDate: result.enrollment.startDate,
                createdAt: result.enrollment.createdAt,
              },
              notifications,
            },
            message: SUCCESS_MESSAGES.APPLICATION_APPROVED,
          },
          { status: 200 }
        );

      } catch (transactionError) {
        console.error('Transaction failed during application approval:', transactionError);

        // Release processing lock on transaction failure
        releaseProcessingLock(applicationId, adminUserId);

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TRANSACTION_FAILED',
              message: ERROR_MESSAGES.TRANSACTION_FAILED,
              details: {
                step: 'application_approval',
                reason: 'Database transaction failed',
              },
            },
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Error processing application enrollment:', error);

    // Release processing lock on any unexpected error
    const requestBody = await request.json().catch(() => ({}));
    const { applicationId } = requestBody;
    if (applicationId) {
      const session = await auth().catch(() => null);
      if (session?.user?.id) {
        releaseProcessingLock(applicationId, parseInt(session.user.id));
      }
    }

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