/**
 * Fix school data consistency
 * Sets user teamId to match their teacher schoolId
 */

import { db } from '@/lib/db/drizzle';
import { users, teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSchoolConsistency() {
  console.log('Fixing school data consistency...\n');

  // Get all teachers
  const allTeachers = await db.select().from(teachers);

  for (const teacher of allTeachers) {
    const user = await db.select().from(users).where(eq(users.id, teacher.userId)).limit(1);

    if (user.length === 0) {
      console.log(`⚠️  Teacher ${teacher.id} has no user (userId: ${teacher.userId})`);
      continue;
    }

    const currentUser = user[0];

    if (currentUser.teamId !== teacher.schoolId) {
      console.log(`Fixing user ${currentUser.id} (${currentUser.email}):`);
      console.log(`  Current teamId: ${currentUser.teamId}`);
      console.log(`  Teacher schoolId: ${teacher.schoolId}`);

      await db
        .update(users)
        .set({ teamId: teacher.schoolId })
        .where(eq(users.id, currentUser.id));

      console.log(`  ✓ Updated teamId to ${teacher.schoolId}\n`);
    } else {
      console.log(`✓ User ${currentUser.email} already has correct teamId: ${currentUser.teamId}\n`);
    }
  }

  console.log('Done!');
}

fixSchoolConsistency()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
