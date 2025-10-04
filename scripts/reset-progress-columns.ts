import { db } from '../lib/db/drizzle';
import { progressColumns } from '../lib/db/schema/progress-columns';
import { eq } from 'drizzle-orm';

async function resetProgressColumns() {
  console.log('Resetting progress board columns...');

  const schoolId = 1;

  // Delete existing columns
  const deleted = await db
    .delete(progressColumns)
    .where(eq(progressColumns.schoolId, schoolId))
    .returning();

  console.log(`Deleted ${deleted.length} existing columns`);

  // Insert correct columns matching lesson_progress_status enum
  const defaultColumns = [
    {
      schoolId,
      name: 'Not Started',
      statusValue: 'not_started',
      position: 0,
      color: '#94A3B8', // Slate gray
      isActive: true,
    },
    {
      schoolId,
      name: 'In Progress',
      statusValue: 'in_progress',
      position: 1,
      color: '#60A5FA', // Blue
      isActive: true,
    },
    {
      schoolId,
      name: 'On Hold',
      statusValue: 'on_hold',
      position: 2,
      color: '#FBBF24', // Yellow
      isActive: true,
    },
    {
      schoolId,
      name: 'Completed',
      statusValue: 'completed',
      position: 3,
      color: '#10B981', // Green
      isActive: true,
    },
  ];

  const created = await db
    .insert(progressColumns)
    .values(defaultColumns)
    .returning();

  console.log(`✅ Successfully created ${created.length} progress columns:`);
  created.forEach((col) => {
    console.log(`  - ${col.name} (${col.statusValue}) - Position ${col.position}`);
  });
}

resetProgressColumns()
  .catch((error) => {
    console.error('Failed to reset progress columns:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
