import { db } from '../lib/db/drizzle';
import { lessonProgress, lessons, children } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkLessonProgress() {
  console.log('Checking lesson progress records...\n');

  const records = await db
    .select({
      id: lessonProgress.id,
      lessonId: lessonProgress.lessonId,
      lessonTitle: lessons.title,
      studentId: lessonProgress.studentId,
      studentName: children.firstName,
      studentLastName: children.lastName,
      status: lessonProgress.status,
      createdAt: lessonProgress.createdAt,
    })
    .from(lessonProgress)
    .leftJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .leftJoin(children, eq(lessonProgress.studentId, children.id))
    .orderBy(lessonProgress.createdAt);

  console.log(`Found ${records.length} lesson progress records:\n`);

  records.forEach((record, index) => {
    const studentName = record.studentName && record.studentLastName
      ? `${record.studentName} ${record.studentLastName}`
      : 'Unknown Student';

    console.log(`${index + 1}. ${record.lessonTitle || 'Unknown Lesson'}`);
    console.log(`   Student: ${studentName}`);
    console.log(`   Status: ${record.status}`);
    console.log(`   Created: ${record.createdAt}`);
    console.log(`   ID: ${record.id}\n`);
  });

  // Check for duplicates (same lesson + student + status)
  const duplicateCheck = new Map<string, number>();

  records.forEach(record => {
    const key = `${record.lessonId}-${record.studentId}-${record.status}`;
    duplicateCheck.set(key, (duplicateCheck.get(key) || 0) + 1);
  });

  const duplicates = Array.from(duplicateCheck.entries()).filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log('\n⚠️  WARNING: Found duplicate records (same lesson + student + status):');
    duplicates.forEach(([key, count]) => {
      console.log(`   ${key} appears ${count} times`);
    });
  } else {
    console.log('\n✅ No duplicates found (same lesson + student + status)');
  }
}

checkLessonProgress()
  .catch((error) => {
    console.error('Error checking lesson progress:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
