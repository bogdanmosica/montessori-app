/**
 * Script to create test children and assign them to teacher@test.com
 * Run with: npx tsx scripts/seed-teacher-students.ts
 */

import { db } from '@/lib/db';
import { users, children, teachers, teacherStudentAssignments, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedTeacherStudents() {
  try {
    console.log('🌱 Starting teacher students seed...');

    // 1. Find the teacher user
    const teacherUser = await db.query.users.findFirst({
      where: eq(users.email, 'teacher@test.com')
    });

    if (!teacherUser) {
      console.error('❌ Teacher user not found with email: teacher@test.com');
      console.log('Please run: npx tsx scripts/create-teacher-user.ts first');
      return;
    }

    console.log(`✓ Found teacher user: ${teacherUser.email} (ID: ${teacherUser.id})`);

    // 2. Find or create a school/team
    let school = await db.query.teams.findFirst();

    if (!school) {
      console.log('Creating test school...');
      const [newSchool] = await db.insert(teams).values({
        name: 'Test Montessori School',
        defaultMonthlyFeeRon: '150.00',
        maximumCapacity: 50,
      }).returning();
      school = newSchool;
      console.log(`✓ Created school: ${school.name} (ID: ${school.id})`);
    } else {
      console.log(`✓ Using existing school: ${school.name} (ID: ${school.id})`);
    }

    // 3. Create or find teacher record
    let teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, teacherUser.id)
    });

    if (!teacher) {
      console.log('Creating teacher record...');
      const [newTeacher] = await db.insert(teachers).values({
        userId: teacherUser.id,
        schoolId: school.id,
      }).returning();
      teacher = newTeacher;
      console.log(`✓ Created teacher record (ID: ${teacher.id})`);
    } else {
      console.log(`✓ Teacher record exists (ID: ${teacher.id})`);
    }

    // 4. Create test children
    console.log('\nCreating test children...');

    const testChildren = [
      {
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2019-03-15'),
        gender: 'Female',
        enrollmentStatus: 'ACTIVE' as const,
        classGroup: 'Morning Class',
      },
      {
        firstName: 'Liam',
        lastName: 'Williams',
        dateOfBirth: new Date('2018-07-22'),
        gender: 'Male',
        enrollmentStatus: 'ACTIVE' as const,
        classGroup: 'Morning Class',
      },
      {
        firstName: 'Olivia',
        lastName: 'Brown',
        dateOfBirth: new Date('2019-11-08'),
        gender: 'Female',
        enrollmentStatus: 'ACTIVE' as const,
        classGroup: 'Afternoon Class',
      },
      {
        firstName: 'Noah',
        lastName: 'Davis',
        dateOfBirth: new Date('2018-05-30'),
        gender: 'Male',
        enrollmentStatus: 'ACTIVE' as const,
        classGroup: 'Morning Class',
      },
      {
        firstName: 'Ava',
        lastName: 'Miller',
        dateOfBirth: new Date('2019-09-12'),
        gender: 'Female',
        enrollmentStatus: 'INACTIVE' as const,
        classGroup: 'Afternoon Class',
      },
      {
        firstName: 'Ethan',
        lastName: 'Wilson',
        dateOfBirth: new Date('2018-12-03'),
        gender: 'Male',
        enrollmentStatus: 'ACTIVE' as const,
        classGroup: 'Morning Class',
      },
    ];

    const createdChildren = [];

    for (const child of testChildren) {
      // Check if child already exists by name
      const existingChild = await db.query.children.findFirst({
        where: (children, { and, eq }) => and(
          eq(children.firstName, child.firstName),
          eq(children.lastName, child.lastName),
          eq(children.schoolId, school!.id)
        )
      });

      if (existingChild) {
        console.log(`  ⊙ Child already exists: ${child.firstName} ${child.lastName}`);
        createdChildren.push(existingChild);
      } else {
        const [newChild] = await db.insert(children).values({
          schoolId: school.id,
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          enrollmentStatus: child.enrollmentStatus,
          monthlyFee: 15000, // 150.00 RON in cents
          startDate: new Date('2024-09-01'),
          createdByAdminId: teacherUser.id, // Using teacher as creator for demo
        }).returning();

        console.log(`  ✓ Created: ${newChild.firstName} ${newChild.lastName} (${newChild.enrollmentStatus})`);
        createdChildren.push({ ...newChild, classGroup: child.classGroup });
      }
    }

    // 5. Assign children to teacher
    console.log('\nAssigning children to teacher...');

    for (let i = 0; i < createdChildren.length; i++) {
      const child = createdChildren[i];
      const classGroup = testChildren[i].classGroup;

      // Check if assignment already exists
      const existingAssignment = await db.query.teacherStudentAssignments.findFirst({
        where: (assignments, { and, eq }) => and(
          eq(assignments.teacherId, teacher!.id),
          eq(assignments.studentId, child.id)
        )
      });

      if (existingAssignment) {
        console.log(`  ⊙ Assignment exists: ${child.firstName} ${child.lastName}`);
      } else {
        await db.insert(teacherStudentAssignments).values({
          teacherId: teacher.id,
          studentId: child.id,
          classGroup: classGroup,
          isActive: true,
        });

        console.log(`  ✓ Assigned: ${child.firstName} ${child.lastName} to ${classGroup}`);
      }
    }

    // 6. Summary
    console.log('\n✅ Seed completed successfully!');
    console.log('\nSummary:');
    console.log(`  Teacher: ${teacherUser.email}`);
    console.log(`  School: ${school.name}`);
    console.log(`  Total Students: ${createdChildren.length}`);
    console.log(`  Active: ${createdChildren.filter(c => c.enrollmentStatus === 'ACTIVE').length}`);
    console.log(`  Inactive: ${createdChildren.filter(c => c.enrollmentStatus === 'INACTIVE').length}`);
    console.log('\nYou can now log in as teacher@test.com to see the students!');

  } catch (error) {
    console.error('❌ Error seeding teacher students:', error);
    throw error;
  }
}

seedTeacherStudents()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
