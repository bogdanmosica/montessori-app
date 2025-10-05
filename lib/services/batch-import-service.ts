/**
 * Batch Import Service with Multi-Tenant Scoping
 */

import { db } from '@/lib/db';
import { users, parentProfiles, children, teachers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ENTITY_TYPES, EntityType } from '@/lib/constants/import-constants';
import bcrypt from 'bcryptjs';

interface ImportResult {
  importedCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
}

async function checkEmailExists(email: string, schoolId: number): Promise<boolean> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return existingUser.length > 0;
}

async function checkParentEmailExists(
  email: string,
  schoolId: number
): Promise<boolean> {
  const existingParent = await db
    .select()
    .from(parentProfiles)
    .where(
      and(
        eq(parentProfiles.email, email),
        eq(parentProfiles.schoolId, schoolId)
      )
    )
    .limit(1);

  return existingParent.length > 0;
}

export async function importTeachers(
  rows: any[],
  schoolId: number,
  adminUserId: number
): Promise<ImportResult> {
  const result: ImportResult = {
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Check if user already exists
      const emailExists = await checkEmailExists(row.email, schoolId);
      if (emailExists) {
        result.skippedCount++;
        continue;
      }

      // Create user account
      const defaultPassword = await bcrypt.hash('Password123!', 10);
      const [newUser] = await db
        .insert(users)
        .values({
          name: row.name,
          email: row.email,
          passwordHash: defaultPassword,
          role: 'teacher',
        })
        .returning();

      // Create teacher profile
      await db.insert(teachers).values({
        userId: newUser.id,
        schoolId,
        wage: row.wage ? row.wage.toString() : null,
        nationality: row.nationality || null,
      });

      result.importedCount++;
    } catch (error) {
      result.errors.push({
        row: i + 2,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export async function importParents(
  rows: any[],
  schoolId: number,
  adminUserId: number
): Promise<ImportResult> {
  const result: ImportResult = {
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Check if parent already exists
      const emailExists = await checkParentEmailExists(row.email, schoolId);
      if (emailExists) {
        result.skippedCount++;
        continue;
      }

      // Parse name
      const nameParts = row.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create parent profile
      await db.insert(parentProfiles).values({
        schoolId,
        firstName,
        lastName,
        email: row.email,
        phone: row.phone || null,
      });

      result.importedCount++;
    } catch (error) {
      result.errors.push({
        row: i + 2,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export async function importChildren(
  rows: any[],
  schoolId: number,
  adminUserId: number
): Promise<ImportResult> {
  const result: ImportResult = {
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Check if parent exists
      const parent = await db
        .select()
        .from(parentProfiles)
        .where(
          and(
            eq(parentProfiles.email, row.parent_email),
            eq(parentProfiles.schoolId, schoolId)
          )
        )
        .limit(1);

      if (parent.length === 0) {
        result.errors.push({
          row: i + 2,
          message: `Parent with email ${row.parent_email} not found`,
        });
        continue;
      }

      // Create child
      await db.insert(children).values({
        schoolId,
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: new Date(row.dob),
        monthlyFee: Math.round(row.monthly_fee_RON * 100), // Convert to cents
        enrollmentStatus: row.enrollment_status,
        startDate: new Date(),
        createdByAdminId: adminUserId,
      });

      result.importedCount++;
    } catch (error) {
      result.errors.push({
        row: i + 2,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export async function batchImport(
  entityType: EntityType,
  rows: any[],
  schoolId: number,
  adminUserId: number
): Promise<ImportResult> {
  switch (entityType) {
    case ENTITY_TYPES.TEACHER:
      return await importTeachers(rows, schoolId, adminUserId);
    case ENTITY_TYPES.PARENT:
      return await importParents(rows, schoolId, adminUserId);
    case ENTITY_TYPES.CHILD:
      return await importChildren(rows, schoolId, adminUserId);
    default:
      throw new Error(`Invalid entity type: ${entityType}`);
  }
}
