#!/usr/bin/env tsx

/**
 * Lesson Data Seeder
 * Creates sample lessons for testing the progress board
 */

import { db } from '@/lib/db/drizzle';
import { lessons, teams, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedLessons() {
  try {
    console.log('Starting lesson data seed...');

    // Get all schools and teacher users
    const schools = await db.select().from(teams);
    const teacherUsers = await db.select().from(users).where(eq(users.role, 'teacher'));

    if (schools.length === 0) {
      console.log('No schools found');
      return;
    }

    if (teacherUsers.length === 0) {
      console.log('No teacher users found');
      return;
    }

    const teacherUser = teacherUsers[0];
    console.log(`Found teacher user: ${teacherUser.email}`);

    // Sample lesson data
    const sampleLessons = [
      {
        title: 'Addition with Golden Beads',
        description: 'Introduction to addition using Montessori golden bead materials',
        category: 'Mathematics',
        estimatedDuration: 30,
        difficultyLevel: 'beginner' as const,
      },
      {
        title: 'Letter Recognition A-Z',
        description: 'Learning to recognize and identify letters of the alphabet',
        category: 'Language',
        estimatedDuration: 45,
        difficultyLevel: 'beginner' as const,
      },
      {
        title: 'Plant Life Cycle',
        description: 'Understanding the stages of plant growth from seed to mature plant',
        category: 'Science',
        estimatedDuration: 60,
        difficultyLevel: 'intermediate' as const,
      },
      {
        title: 'Subtraction with Number Rods',
        description: 'Learning subtraction concepts using Montessori number rods',
        category: 'Mathematics',
        estimatedDuration: 40,
        difficultyLevel: 'intermediate' as const,
      },
      {
        title: 'Phonetic Sounds',
        description: 'Introduction to phonetic sounds and pronunciation',
        category: 'Language',
        estimatedDuration: 35,
        difficultyLevel: 'beginner' as const,
      },
      {
        title: 'Geography Puzzle Maps',
        description: 'Learning about continents and countries through puzzle maps',
        category: 'Geography',
        estimatedDuration: 50,
        difficultyLevel: 'intermediate' as const,
      },
      {
        title: 'Multiplication with Bead Chains',
        description: 'Advanced multiplication concepts using bead chains',
        category: 'Mathematics',
        estimatedDuration: 55,
        difficultyLevel: 'advanced' as const,
      },
      {
        title: 'Creative Writing',
        description: 'Encouraging creative expression through writing activities',
        category: 'Language',
        estimatedDuration: 45,
        difficultyLevel: 'advanced' as const,
      },
    ];

    // Create lessons for each school
    for (const school of schools) {
      console.log(`Seeding lessons for school ID: ${school.id}`);

      // Check if lessons already exist for this school
      const existingLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.schoolId, school.id));

      if (existingLessons.length > 0) {
        console.log(`✓ School ${school.id} already has ${existingLessons.length} lessons`);
        continue;
      }

      // Insert sample lessons
      const insertedLessons = await db
        .insert(lessons)
        .values(
          sampleLessons.map((lesson) => ({
            schoolId: school.id,
            title: lesson.title,
            description: lesson.description,
            category: lesson.category,
            estimatedDuration: lesson.estimatedDuration,
            difficultyLevel: lesson.difficultyLevel,
            isTemplate: false,
            createdBy: teacherUser.id,
            updatedBy: teacherUser.id,
          }))
        )
        .returning();

      console.log(`✓ Seeded ${insertedLessons.length} lessons for school ${school.id}`);
    }

    console.log('\n✓ Lesson data seed completed successfully!');
    console.log('Sample lessons include:');
    console.log('  - Mathematics: Addition, Subtraction, Multiplication');
    console.log('  - Language: Letter Recognition, Phonetic Sounds, Creative Writing');
    console.log('  - Science: Plant Life Cycle');
    console.log('  - Geography: Puzzle Maps');
  } catch (error) {
    console.error('Lesson seed failed:', error);
    process.exit(1);
  }
}

seedLessons()
  .then(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });