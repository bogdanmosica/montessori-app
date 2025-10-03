/**
 * Debug script to check school/teacher data consistency
 */

import { db } from '@/lib/db/drizzle';
import { users, teams, teachers } from '@/lib/db/schema';

async function debugSchoolData() {
  console.log('=== USERS ===');
  const allUsers = await db.select().from(users);
  console.log(allUsers);

  console.log('\n=== TEAMS/SCHOOLS ===');
  const allTeams = await db.select().from(teams);
  console.log(allTeams);

  console.log('\n=== TEACHERS ===');
  const allTeachers = await db.select().from(teachers);
  console.log(allTeachers);

  console.log('\n=== DATA CONSISTENCY CHECK ===');
  for (const teacher of allTeachers) {
    const user = allUsers.find(u => u.id === teacher.userId);
    console.log(`Teacher ${teacher.id}:`);
    console.log(`  - userId: ${teacher.userId}`);
    console.log(`  - teacher.schoolId: ${teacher.schoolId}`);
    console.log(`  - user.teamId: ${user?.teamId}`);
    console.log(`  - MISMATCH: ${teacher.schoolId !== user?.teamId ? 'YES ❌' : 'NO ✓'}`);
  }
}

debugSchoolData().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(console.error);
