import { db } from '../lib/db/drizzle';
import { children, enrollments, users, teachers } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function createTestStudents() {
  try {
    console.log('🌱 Creating test students...');

    // Find an admin user to use as creator
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'admin'),
    });

    if (!adminUser) {
      console.error('❌ No admin user found');
      process.exit(1);
    }

    // Find the teacher's school ID
    const teacherUser = await db.query.users.findFirst({
      where: eq(users.email, 'teacher@test.com'),
    });

    if (!teacherUser) {
      console.error('❌ Teacher user not found');
      process.exit(1);
    }

    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, teacherUser.id),
    });

    const schoolId = teacherRecord?.schoolId || 1; // Use teacher's school or default to 1
    console.log(`Using school ID: ${schoolId}`);

    // Create 5 test students
    const testStudents = [
      { firstName: 'Emma', lastName: 'Johnson', dateOfBirth: new Date('2019-03-15') },
      { firstName: 'Liam', lastName: 'Smith', dateOfBirth: new Date('2019-07-22') },
      { firstName: 'Olivia', lastName: 'Brown', dateOfBirth: new Date('2020-01-10') },
      { firstName: 'Noah', lastName: 'Davis', dateOfBirth: new Date('2020-05-18') },
      { firstName: 'Ava', lastName: 'Wilson', dateOfBirth: new Date('2019-11-30') },
    ];

    for (const student of testStudents) {
      // Create child
      const [child] = await db
        .insert(children)
        .values({
          schoolId,
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth,
          gender: 'Not specified',
          startDate: new Date(),
          monthlyFee: 0,
          enrollmentStatus: 'ACTIVE',
          createdByAdminId: adminUser.id,
        })
        .returning();

      // Create active enrollment
      await db.insert(enrollments).values({
        childId: child.id,
        schoolId,
        status: 'active',
        monthlyFeeOverride: 0,
        enrollmentDate: new Date(),
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });

      console.log(`✓ Created student: ${student.firstName} ${student.lastName} (${child.id})`);
    }

    console.log(`\n✅ Done! Created ${testStudents.length} test students with active enrollments.`);
    console.log('\nNow run: npx tsx scripts/seed-teacher-data.ts');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test students:', error);
    process.exit(1);
  }
}

createTestStudents();
