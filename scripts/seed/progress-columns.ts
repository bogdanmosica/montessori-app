/**
 * Seed Script: Default Progress Columns
 *
 * Creates default progress column templates for schools
 * These columns are used in the Teacher Progress Board feature
 */

import { db } from '@/lib/db/drizzle';
import { progressColumns } from '@/lib/db/schema/progress-columns';
import { schools } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Default column configuration
 * Maps to lesson_progress_status enum values
 */
const DEFAULT_COLUMNS = [
  {
    name: 'Not Started',
    statusValue: 'not_started',
    position: 0,
    color: '#EF4444', // red-500
  },
  {
    name: 'In Progress',
    statusValue: 'in_progress',
    position: 1,
    color: '#F59E0B', // amber-500
  },
  {
    name: 'Completed',
    statusValue: 'completed',
    position: 2,
    color: '#10B981', // green-500
  },
  {
    name: 'On Hold',
    statusValue: 'on_hold',
    position: 3,
    color: '#6B7280', // gray-500
  },
];

/**
 * Seed progress columns for a specific school
 */
async function seedProgressColumnsForSchool(schoolId: number) {
  console.log(`Seeding progress columns for school ID: ${schoolId}`);

  for (const column of DEFAULT_COLUMNS) {
    await db.insert(progressColumns).values({
      schoolId,
      name: column.name,
      statusValue: column.statusValue,
      position: column.position,
      color: column.color,
      isActive: true,
    }).onConflictDoNothing();
  }

  console.log(`✓ Seeded ${DEFAULT_COLUMNS.length} columns for school ${schoolId}`);
}

/**
 * Main seed function
 * Seeds progress columns for all existing schools
 */
async function seedProgressColumns() {
  try {
    console.log('Starting progress columns seed...');

    // Get all schools
    const schoolsList = await db.select({ id: schools.id }).from(schools);

    if (schoolsList.length === 0) {
      console.warn('No schools found. Please create schools first.');
      return;
    }

    console.log(`Found ${schoolsList.length} school(s)`);

    // Seed columns for each school
    for (const school of schoolsList) {
      await seedProgressColumnsForSchool(school.id);
    }

    console.log('\n✓ Progress columns seed completed successfully!');
  } catch (error) {
    console.error('Error seeding progress columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedProgressColumns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedProgressColumns, seedProgressColumnsForSchool };
