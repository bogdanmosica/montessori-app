import { db } from '@/lib/db/drizzle';
import { children, enrollments, users, teamMembers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Create enrollment records for existing children who don't have them
 * This script ensures that all ACTIVE children have corresponding enrollment records
 */
async function createEnrollmentRecords() {
  console.log('Starting enrollment records creation for existing children...');

  try {
    // Get all active children who don't have enrollment records
    const childrenWithoutEnrollments = await db
      .select({
        id: children.id,
        schoolId: children.schoolId,
        firstName: children.firstName,
        lastName: children.lastName,
        startDate: children.startDate,
        createdByAdminId: children.createdByAdminId,
        enrollmentStatus: children.enrollmentStatus,
      })
      .from(children)
      .leftJoin(enrollments, eq(children.id, enrollments.childId))
      .where(
        and(
          eq(children.enrollmentStatus, 'ACTIVE'),
          isNull(enrollments.id) // No enrollment record exists
        )
      );

    console.log(`Found ${childrenWithoutEnrollments.length} children without enrollment records`);

    if (childrenWithoutEnrollments.length === 0) {
      console.log('No enrollment records need to be created.');
      return;
    }

    // Get the first admin user for each school to use as createdBy
    const adminUsers = await db
      .select({
        id: users.id,
        schoolId: teamMembers.teamId,
      })
      .from(users)
      .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(eq(users.role, 'admin'));

    const adminsBySchool = new Map<number, number>();
    adminUsers.forEach(admin => {
      if (admin.schoolId && !adminsBySchool.has(admin.schoolId)) {
        adminsBySchool.set(admin.schoolId, admin.id);
      }
    });

    // Create enrollment records
    const enrollmentRecords = [];
    let createdCount = 0;

    for (const child of childrenWithoutEnrollments) {
      const adminUserId = adminsBySchool.get(child.schoolId) || child.createdByAdminId;
      
      if (!adminUserId) {
        console.warn(`No admin user found for child ${child.firstName} ${child.lastName} in school ${child.schoolId}, skipping...`);
        continue;
      }

      enrollmentRecords.push({
        childId: child.id,
        schoolId: child.schoolId,
        status: 'active' as const,
        enrollmentDate: child.startDate || new Date(), // Use startDate or current date
        createdBy: adminUserId,
        updatedBy: adminUserId,
        notes: 'Auto-created during migration from existing child profile',
      });

      console.log(`Prepared enrollment record for ${child.firstName} ${child.lastName}`);
    }

    if (enrollmentRecords.length > 0) {
      // Insert in batches to avoid hitting query limits
      const batchSize = 10;
      for (let i = 0; i < enrollmentRecords.length; i += batchSize) {
        const batch = enrollmentRecords.slice(i, i + batchSize);
        
        const inserted = await db
          .insert(enrollments)
          .values(batch)
          .returning({ id: enrollments.id, childId: enrollments.childId });

        createdCount += inserted.length;
        console.log(`Created enrollment records batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} records`);
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} enrollment records`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error creating enrollment records:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createEnrollmentRecords()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createEnrollmentRecords };