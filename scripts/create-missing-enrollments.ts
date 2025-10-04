import { db } from '../lib/db/drizzle';
import { children, enrollments } from '../lib/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';

async function createMissingEnrollments() {
  console.log('Creating missing enrollment records...');

  // Get all ACTIVE children
  const activeChildren = await db
    .select()
    .from(children)
    .where(eq(children.enrollmentStatus, 'ACTIVE'));

  console.log(`Found ${activeChildren.length} active children`);

  // Get existing enrollment child IDs
  const existingEnrollments = await db
    .select({ childId: enrollments.childId })
    .from(enrollments);

  const enrolledChildIds = new Set(existingEnrollments.map(e => e.childId));

  // Find children without enrollment records
  const childrenNeedingEnrollments = activeChildren.filter(
    child => !enrolledChildIds.has(child.id)
  );

  if (childrenNeedingEnrollments.length === 0) {
    console.log('All active children already have enrollment records');
    return;
  }

  console.log(`Creating enrollment records for ${childrenNeedingEnrollments.length} children...`);

  // Create enrollment records
  const enrollmentData = childrenNeedingEnrollments.map(child => ({
    childId: child.id,
    schoolId: child.schoolId,
    status: 'active' as const,
    enrollmentDate: child.startDate,
    createdBy: child.createdByAdminId!,
    updatedBy: child.createdByAdminId!,
    notes: 'Auto-created enrollment record from migration script',
  }));

  const created = await db
    .insert(enrollments)
    .values(enrollmentData)
    .returning();

  console.log(`✅ Successfully created ${created.length} enrollment records:`);
  for (const child of childrenNeedingEnrollments) {
    console.log(`  - ${child.firstName} ${child.lastName}`);
  }
}

createMissingEnrollments()
  .catch((error) => {
    console.error('Failed to create enrollments:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
