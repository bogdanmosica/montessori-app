#!/usr/bin/env tsx

/**
 * Student Data Seeder
 * Creates sample students for testing the progress board
 */

import { db } from '@/lib/db/drizzle';
import { children, teams, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedStudents() {
  try {
    console.log('Starting student data seed...');

    // Get all schools and admin users  
    const schools = await db.select().from(teams);
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));

    if (schools.length === 0) {
      console.log('No schools found');
      return;
    }

    if (adminUsers.length === 0) {
      console.log('No admin users found');
      return;
    }

    const adminUser = adminUsers[0];
    console.log(`Found admin user: ${adminUser.email}`);

    // Sample student data
    const sampleStudents = [
      {
        firstName: 'Emma',
        lastName: 'Johnson',
        gender: 'female',
        dateOfBirth: new Date('2019-03-15'), // ~5 years old
      },
      {
        firstName: 'Liam',
        lastName: 'Smith',
        gender: 'male',
        dateOfBirth: new Date('2020-07-22'), // ~4 years old
      },
      {
        firstName: 'Olivia',
        lastName: 'Brown',
        gender: 'female',
        dateOfBirth: new Date('2018-11-08'), // ~6 years old
      },
      {
        firstName: 'Noah',
        lastName: 'Davis',
        gender: 'male',
        dateOfBirth: new Date('2019-09-30'), // ~5 years old
      },
      {
        firstName: 'Sophia',
        lastName: 'Wilson',
        gender: 'female',
        dateOfBirth: new Date('2020-01-14'), // ~4 years old
      },
      {
        firstName: 'Jackson',
        lastName: 'Miller',
        gender: 'male', 
        dateOfBirth: new Date('2018-05-27'), // ~6 years old
      },
    ];

    // Create students for each school
    for (const school of schools) {
      console.log(`Seeding students for school ID: ${school.id}`);

      // Check if students already exist for this school
      const existingStudents = await db
        .select()
        .from(children)
        .where(eq(children.schoolId, school.id));

      if (existingStudents.length > 0) {
        console.log(`✓ School ${school.id} already has ${existingStudents.length} students`);
        continue;
      }

      // Insert sample students
      const insertedStudents = await db
        .insert(children)
        .values(
          sampleStudents.map((student) => ({
            schoolId: school.id,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            monthlyFee: 65000, // $650 in cents
            enrollmentStatus: 'ACTIVE' as const,
            startDate: new Date(),
            createdByAdminId: adminUser.id,
          }))
        )
        .returning();

      console.log(`✓ Seeded ${insertedStudents.length} students for school ${school.id}`);
    }

    console.log('\n✓ Student data seed completed successfully!');
    console.log('Sample students include:');
    console.log('  - Emma Johnson (5 years old)');
    console.log('  - Liam Smith (4 years old)');
    console.log('  - Olivia Brown (6 years old)');
    console.log('  - Noah Davis (5 years old)');
    console.log('  - Sophia Wilson (4 years old)');
    console.log('  - Jackson Miller (6 years old)');
  } catch (error) {
    console.error('Student seed failed:', error);
    process.exit(1);
  }
}

seedStudents()
  .then(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });