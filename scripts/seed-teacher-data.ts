import { db } from '../lib/db/drizzle';
import { users, teachers, children, teacherStudentAssignments, enrollments } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function seedTeacherData() {
  try {
    console.log('🌱 Seeding teacher data...');

    // 1. Find the teacher user
    const teacherUser = await db.query.users.findFirst({
      where: eq(users.email, 'teacher@test.com'),
    });

    if (!teacherUser) {
      console.error('❌ Teacher user not found. Please ensure teacher@test.com exists.');
      process.exit(1);
    }

    console.log(`✓ Found teacher user: ${teacherUser.email} (ID: ${teacherUser.id})`);

    // 2. Check if teacher record exists, if not create one
    let teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, teacherUser.id),
    });

    if (!teacherRecord) {
      console.log('Creating teacher record...');
      const [newTeacher] = await db.insert(teachers).values({
        userId: teacherUser.id,
        schoolId: 1, // Assuming school ID 1
      }).returning();
      teacherRecord = newTeacher;
      console.log(`✓ Created teacher record (ID: ${teacherRecord.id})`);
    } else {
      console.log(`✓ Teacher record exists (ID: ${teacherRecord.id})`);
    }

    // 3. Get all active enrolled students from the school
    console.log(`Looking for students in school ID: ${teacherRecord.schoolId}`);

    const activeStudents = await db
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        schoolId: children.schoolId,
      })
      .from(children)
      .innerJoin(enrollments, eq(children.id, enrollments.childId))
      .where(
        and(
          eq(children.schoolId, teacherRecord.schoolId),
          eq(enrollments.status, 'active')
        )
      )
      .limit(10); // Assign up to 10 students

    console.log(`Query returned ${activeStudents.length} students`);

    if (activeStudents.length === 0) {
      console.log('⚠️  No active enrolled students found in the school.');
      console.log('You may need to:');
      console.log('  1. Create student records (children table)');
      console.log('  2. Create enrollments for those students');
      console.log(`\nDebug: Teacher school ID is ${teacherRecord.schoolId}`);
      process.exit(0);
    }

    console.log(`✓ Found ${activeStudents.length} active students to assign`);

    // 4. Create teacher-student assignments
    let assignedCount = 0;
    for (const student of activeStudents) {
      // Check if assignment already exists
      const existing = await db.query.teacherStudentAssignments.findFirst({
        where: and(
          eq(teacherStudentAssignments.teacherId, teacherRecord.id),
          eq(teacherStudentAssignments.studentId, student.id)
        ),
      });

      if (!existing) {
        await db.insert(teacherStudentAssignments).values({
          teacherId: teacherRecord.id,
          studentId: student.id,
          classGroup: 'Primary Class',
          isActive: true,
        });
        console.log(`  ✓ Assigned: ${student.firstName} ${student.lastName}`);
        assignedCount++;
      } else {
        console.log(`  - Already assigned: ${student.firstName} ${student.lastName}`);
      }
    }

    console.log(`\n✅ Done! Assigned ${assignedCount} new students to the teacher.`);
    console.log(`Total students in roster: ${activeStudents.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding teacher data:', error);
    process.exit(1);
  }
}

seedTeacherData();
