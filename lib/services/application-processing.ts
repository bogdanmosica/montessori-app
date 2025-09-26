import { db } from '../db/drizzle';
import { applications, children, parentProfiles, parentChildRelationships, adminAccessLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { createChildProfile } from './child-profile-creation';
import { findOrCreateParentProfile } from './parent-profile-matching';
import { logAdminAction } from './access-logging';
import type { ApplicationDetail } from './application-queries';

export interface ApprovalResult {
  application: ApplicationDetail;
  child_profile: any;
  parent_profiles: any[];
  access_log: any;
}

export interface RejectionResult {
  application: ApplicationDetail;
  access_log: any;
}

export interface RejectionData {
  reason?: string;
}

/**
 * Approve an application and create child/parent profiles
 */
export async function approveApplication(
  applicationId: string,
  adminUserId: number,
  schoolId: number
): Promise<ApprovalResult> {
  return await db.transaction(async (tx) => {
    // 1. Check if application exists and is pending
    const appResults = await tx
      .select()
      .from(applications)
      .where(and(
        eq(applications.id, applicationId),
        eq(applications.schoolId, schoolId)
      ))
      .limit(1);

    const application = appResults[0];
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application already processed');
    }

    // 2. Update application status
    const now = new Date();
    await tx
      .update(applications)
      .set({
        status: 'APPROVED',
        processedAt: now,
        processedByAdminId: adminUserId,
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId));

    // 3. Create child profile
    const childData = {
      schoolId,
      applicationId,
      firstName: application.childFirstName,
      lastName: application.childLastName,
      dateOfBirth: application.childDateOfBirth,
      gender: application.childGender,
      startDate: application.preferredStartDate,
      specialNeeds: application.specialNeeds,
      medicalConditions: application.medicalConditions,
      enrollmentStatus: 'ACTIVE' as const,
      createdByAdminId: adminUserId,
    };

    const childProfile = await createChildProfile(childData, tx);

    // 4. Create/link parent profiles
    const parentProfilesToCreate = [];

    // Parent 1 (required)
    parentProfilesToCreate.push({
      firstName: application.parent1FirstName,
      lastName: application.parent1LastName,
      email: application.parent1Email,
      phone: application.parent1Phone,
      relationshipType: application.parent1Relationship,
      primaryContact: true, // First parent is primary by default
    });

    // Parent 2 (optional)
    if (application.parent2FirstName && application.parent2Email) {
      parentProfilesToCreate.push({
        firstName: application.parent2FirstName,
        lastName: application.parent2LastName,
        email: application.parent2Email,
        phone: application.parent2Phone,
        relationshipType: application.parent2Relationship!,
        primaryContact: false,
      });
    }

    const createdParentProfiles = [];
    for (const parentData of parentProfilesToCreate) {
      const parentProfile = await findOrCreateParentProfile(
        {
          schoolId,
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          email: parentData.email,
          phone: parentData.phone,
        },
        tx
      );

      // Create parent-child relationship
      await tx.insert(parentChildRelationships).values({
        schoolId,
        parentId: parentProfile.id,
        childId: childProfile.id,
        relationshipType: parentData.relationshipType,
        primaryContact: parentData.primaryContact,
        pickupAuthorized: true,
      });

      createdParentProfiles.push({
        ...parentProfile,
        relationship_to_child: parentData.relationshipType,
        primary_contact: parentData.primaryContact,
        pickup_authorized: true,
      });
    }

    // 5. Log the action
    const accessLog = await logAdminAction({
      schoolId,
      adminUserId,
      actionType: 'APPLICATION_APPROVED',
      targetType: 'APPLICATION',
      targetId: applicationId,
      details: {
        child_profile_id: childProfile.id,
        parent_profile_ids: createdParentProfiles.map(p => p.id),
        processed_at: now.toISOString(),
      },
    }, tx);

    // 6. Format response
    const updatedApplication: ApplicationDetail = {
      id: application.id,
      status: 'APPROVED',
      child_first_name: application.childFirstName,
      child_last_name: application.childLastName,
      child_date_of_birth: application.childDateOfBirth.toISOString().split('T')[0],
      child_gender: application.childGender,
      preferred_start_date: application.preferredStartDate.toISOString().split('T')[0],
      special_needs: application.specialNeeds,
      medical_conditions: application.medicalConditions,
      parent1_first_name: application.parent1FirstName,
      parent1_last_name: application.parent1LastName,
      parent1_email: application.parent1Email,
      parent1_phone: application.parent1Phone,
      parent1_relationship: application.parent1Relationship,
      parent2_first_name: application.parent2FirstName,
      parent2_last_name: application.parent2LastName,
      parent2_email: application.parent2Email,
      parent2_phone: application.parent2Phone,
      parent2_relationship: application.parent2Relationship,
      submitted_at: application.submittedAt.toISOString(),
      processed_at: now.toISOString(),
      processed_by_admin_id: adminUserId.toString(),
    };

    return {
      application: updatedApplication,
      child_profile: {
        id: childProfile.id,
        application_id: applicationId,
        first_name: childProfile.firstName,
        last_name: childProfile.lastName,
        date_of_birth: childProfile.dateOfBirth.toISOString().split('T')[0],
        gender: childProfile.gender,
        enrollment_status: childProfile.enrollmentStatus,
        start_date: childProfile.startDate.toISOString().split('T')[0],
        special_needs: childProfile.specialNeeds,
        medical_conditions: childProfile.medicalConditions,
        created_at: childProfile.createdAt.toISOString(),
        created_by_admin_id: adminUserId.toString(),
      },
      parent_profiles: createdParentProfiles.map(p => ({
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
        id: accessLog.id,
        action_type: accessLog.actionType,
        target_type: accessLog.targetType,
        target_id: accessLog.targetId,
        details: JSON.parse(accessLog.details || '{}'),
        timestamp: accessLog.timestamp.toISOString(),
      },
    };
  });
}

/**
 * Reject an application
 */
export async function rejectApplication(
  applicationId: string,
  adminUserId: number,
  schoolId: number,
  data?: RejectionData
): Promise<RejectionResult> {
  return await db.transaction(async (tx) => {
    // 1. Check if application exists and is pending
    const appResults = await tx
      .select()
      .from(applications)
      .where(and(
        eq(applications.id, applicationId),
        eq(applications.schoolId, schoolId)
      ))
      .limit(1);

    const application = appResults[0];
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application already processed');
    }

    // 2. Update application status
    const now = new Date();
    await tx
      .update(applications)
      .set({
        status: 'REJECTED',
        processedAt: now,
        processedByAdminId: adminUserId,
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId));

    // 3. Log the action
    const accessLog = await logAdminAction({
      schoolId,
      adminUserId,
      actionType: 'APPLICATION_REJECTED',
      targetType: 'APPLICATION',
      targetId: applicationId,
      details: {
        reason: data?.reason || null,
        processed_at: now.toISOString(),
      },
    }, tx);

    // 4. Format response
    const updatedApplication: ApplicationDetail = {
      id: application.id,
      status: 'REJECTED',
      child_first_name: application.childFirstName,
      child_last_name: application.childLastName,
      child_date_of_birth: application.childDateOfBirth.toISOString().split('T')[0],
      child_gender: application.childGender,
      preferred_start_date: application.preferredStartDate.toISOString().split('T')[0],
      special_needs: application.specialNeeds,
      medical_conditions: application.medicalConditions,
      parent1_first_name: application.parent1FirstName,
      parent1_last_name: application.parent1LastName,
      parent1_email: application.parent1Email,
      parent1_phone: application.parent1Phone,
      parent1_relationship: application.parent1Relationship,
      parent2_first_name: application.parent2FirstName,
      parent2_last_name: application.parent2LastName,
      parent2_email: application.parent2Email,
      parent2_phone: application.parent2Phone,
      parent2_relationship: application.parent2Relationship,
      submitted_at: application.submittedAt.toISOString(),
      processed_at: now.toISOString(),
      processed_by_admin_id: adminUserId.toString(),
    };

    return {
      application: updatedApplication,
      access_log: {
        id: accessLog.id,
        action_type: accessLog.actionType,
        target_type: accessLog.targetType,
        target_id: accessLog.targetId,
        details: JSON.parse(accessLog.details || '{}'),
        timestamp: accessLog.timestamp.toISOString(),
      },
    };
  });
}