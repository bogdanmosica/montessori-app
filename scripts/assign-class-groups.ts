import { db } from '../lib/db/drizzle';
import { teacherStudentAssignments, children } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

function getClassGroupByAge(dateOfBirth: Date): string {
  const ageInMonths = Math.floor(
    (new Date().getTime() - dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (ageInMonths >= 18 && ageInMonths <= 36) return 'Toddler A';
  if (ageInMonths >= 37 && ageInMonths <= 72) return 'Primary A';
  if (ageInMonths >= 73 && ageInMonths <= 144) return 'Elementary A';
  return 'Mixed Age';
}

async function assignClassGroups() {
  console.log('Assigning class groups to students...');

  // Get all assignments without class group
  const assignments = await db
    .select({
      id: teacherStudentAssignments.id,
      studentId: teacherStudentAssignments.studentId,
      childFirstName: children.firstName,
      childLastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
    })
    .from(teacherStudentAssignments)
    .innerJoin(children, eq(teacherStudentAssignments.studentId, children.id))
    .where(isNull(teacherStudentAssignments.classGroup));

  if (assignments.length === 0) {
    console.log('All students already have class assignments');
    return;
  }

  console.log(`Found ${assignments.length} students without class assignment`);

  for (const assignment of assignments) {
    const classGroup = getClassGroupByAge(assignment.dateOfBirth);

    await db
      .update(teacherStudentAssignments)
      .set({ classGroup })
      .where(eq(teacherStudentAssignments.id, assignment.id));

    console.log(`  - ${assignment.childFirstName} ${assignment.childLastName} → ${classGroup}`);
  }

  console.log(`✅ Successfully assigned class groups to ${assignments.length} students`);
}

assignClassGroups()
  .catch((error) => {
    console.error('Failed to assign class groups:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
