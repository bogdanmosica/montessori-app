import { db } from '../lib/db/drizzle';
import { children, enrollments, applications, schools } from '../lib/db/schema';
import { eq, count } from 'drizzle-orm';

async function checkMetrics() {
  const schoolId = 1;

  console.log('=== CHECKING METRICS FOR SCHOOL', schoolId, '===\n');

  // Check children
  const childrenResult = await db
    .select({ count: count() })
    .from(children)
    .where(eq(children.schoolId, schoolId));

  console.log('Children count:', childrenResult[0]?.count || 0);

  // Check enrollments
  const enrollmentsResult = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.schoolId, schoolId));

  console.log('Enrollments count:', enrollmentsResult[0]?.count || 0);

  // Check active enrollments
  const activeEnrollmentsResult = await db
    .select({ count: count() })
    .from(enrollments)
    .where(eq(enrollments.schoolId, schoolId));

  console.log('Active enrollments:', activeEnrollmentsResult[0]?.count || 0);

  // Check applications
  const applicationsResult = await db
    .select({ count: count() })
    .from(applications)
    .where(eq(applications.schoolId, schoolId));

  console.log('Applications count:', applicationsResult[0]?.count || 0);

  // Sample children data
  const sampleChildren = await db
    .select()
    .from(children)
    .where(eq(children.schoolId, schoolId))
    .limit(5);

  console.log('\nSample children:', sampleChildren);

  // Sample enrollments
  const sampleEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.schoolId, schoolId))
    .limit(5);

  console.log('\nSample enrollments:', sampleEnrollments);

  process.exit(0);
}

checkMetrics().catch(console.error);
