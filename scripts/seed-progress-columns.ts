import { db } from '../lib/db/drizzle';
import { progressColumns } from '../lib/db/schema/progress-columns';
import { eq, and } from 'drizzle-orm';

async function seedProgressColumns() {
  console.log('Seeding default progress board columns...');

  const schoolId = 1; // Assuming school ID is 1

  // Default progress columns matching lesson_progress_status enum
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

  // Check if columns already exist
  const existing = await db
    .select()
    .from(progressColumns)
    .where(eq(progressColumns.schoolId, schoolId));

  if (existing.length > 0) {
    console.log(`Progress columns already exist for school ${schoolId} (${existing.length} columns)`);
    console.log('Existing columns:', existing.map(c => c.name).join(', '));
    return;
  }

  // Insert default columns
  const created = await db
    .insert(progressColumns)
    .values(defaultColumns)
    .returning();

  console.log(`✅ Successfully created ${created.length} progress columns:`);
  created.forEach((col) => {
    console.log(`  - ${col.name} (${col.statusValue}) - Position ${col.position}`);
  });
}

seedProgressColumns()
  .catch((error) => {
    console.error('Failed to seed progress columns:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
