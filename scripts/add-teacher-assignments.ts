import { db } from '../lib/db/drizzle';
import { users, children, teachers, teacherStudentAssignments } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function addTeacherAssignments() {
  console.log('Adding teacher record and student assignments...');

  // Get the teacher user
  const [teacherUser] = await db.select().from(users).where(eq(users.email, 'teacher@test.com'));

  if (!teacherUser) {
    console.error('Teacher user not found!');
    process.exit(1);
  }

  // Check if teacher record already exists
  const existingTeacher = await db.select().from(teachers).where(eq(teachers.userId, teacherUser.id));

  let teacher;
  if (existingTeacher.length > 0) {
    console.log('Teacher record already exists, using existing record...');
    teacher = existingTeacher[0];
  } else {
    console.log('Creating teacher record...');
    const now = new Date();
    [teacher] = await db.insert(teachers).values({
      userId: teacherUser.id,
      schoolId: 1, // Assuming school ID is 1
      firstName: 'Teacher',
      lastName: 'User',
      email: 'teacher@test.com',
      phoneNumber: '555-0100',
      isActive: true,
      hireDate: new Date(now.getFullYear() - 2, 8, 1),
    }).returning();
    console.log('Teacher record created with ID:', teacher.id);
  }

  // Get all children
  const allChildren = await db.select().from(children);
  console.log(`Found ${allChildren.length} students`);

  // Check existing assignments
  const existingAssignments = await db.select().from(teacherStudentAssignments)
    .where(eq(teacherStudentAssignments.teacherId, teacher.id));

  if (existingAssignments.length > 0) {
    console.log(`Teacher already has ${existingAssignments.length} student assignments`);
    return;
  }

  // Create assignments
  console.log('Creating student assignments...');
  const now = new Date();
  await db.insert(teacherStudentAssignments).values(
    allChildren.map(child => ({
      teacherId: teacher.id,
      studentId: child.id,
      isActive: true,
      assignedAt: new Date(now.getFullYear(), 0, 1),
    }))
  );

  console.log(`Successfully assigned ${allChildren.length} students to teacher ${teacher.firstName} ${teacher.lastName}`);
}

addTeacherAssignments()
  .catch((error) => {
    console.error('Failed to add teacher assignments:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
