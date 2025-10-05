/**
 * Seed Default Lessons Only
 *
 * Adds default Montessori lessons to existing schools
 */

import { db } from '@/lib/db/drizzle';
import { lessons } from '@/lib/db/schema/lessons';
import { schools, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { LESSON_CATEGORIES, LESSON_VISIBILITY, DIFFICULTY_LEVELS } from '@/lib/constants/lessons';

async function seedLessonsOnly() {
  try {
    console.log('Starting lessons seed...');

    // Get first school
    const schoolList = await db.select({ id: schools.id }).from(schools).limit(1);

    if (schoolList.length === 0) {
      console.error('No schools found. Please run the main seed first.');
      process.exit(1);
    }

    const schoolId = schoolList[0].id;

    // Get admin user
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (adminUsers.length === 0) {
      console.error('No admin user found. Please run the main seed first.');
      process.exit(1);
    }

    const adminUserId = adminUsers[0].id;

    console.log(`Seeding lessons for school ID: ${schoolId}`);

    const defaultLessons = [
      // Practical Life
      {
        title: 'Pouring Water - Pitcher to Pitcher',
        description: 'Learn to pour water from one pitcher to another with precision and control. This activity develops hand-eye coordination and concentration.',
        category: LESSON_CATEGORIES.PRACTICAL_LIFE,
        estimatedDuration: 15,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Spooning Activities',
        description: 'Practice transferring items using different types of spoons. Builds fine motor skills and prepares for self-feeding.',
        category: LESSON_CATEGORIES.PRACTICAL_LIFE,
        estimatedDuration: 20,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Folding Cloth',
        description: 'Learn various folding techniques with different types of cloth. Develops sequential thinking and hand coordination.',
        category: LESSON_CATEGORIES.PRACTICAL_LIFE,
        estimatedDuration: 25,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },

      // Sensorial
      {
        title: 'Pink Tower',
        description: 'Work with the Pink Tower to develop visual discrimination of size. Introduction to gradation and the decimal system.',
        category: LESSON_CATEGORIES.SENSORIAL,
        estimatedDuration: 30,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Brown Stair',
        description: 'Explore gradation of width using the Brown Stair blocks. Prepares for mathematical concepts.',
        category: LESSON_CATEGORIES.SENSORIAL,
        estimatedDuration: 30,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Color Tablets',
        description: 'Refine color discrimination and learn color names through matching and grading activities.',
        category: LESSON_CATEGORIES.SENSORIAL,
        estimatedDuration: 25,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },

      // Language
      {
        title: 'Sandpaper Letters',
        description: 'Introduction to letter sounds and formation through tactile exploration of sandpaper letters.',
        category: LESSON_CATEGORIES.LANGUAGE,
        estimatedDuration: 20,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Metal Insets',
        description: 'Develop pencil control and prepare for writing through tracing and filling geometric shapes.',
        category: LESSON_CATEGORIES.LANGUAGE,
        estimatedDuration: 35,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },
      {
        title: 'Moveable Alphabet',
        description: 'Build words phonetically using the moveable alphabet. Bridges the gap between spoken and written language.',
        category: LESSON_CATEGORIES.LANGUAGE,
        estimatedDuration: 30,
        difficultyLevel: DIFFICULTY_LEVELS.ADVANCED,
      },

      // Mathematics
      {
        title: 'Number Rods',
        description: 'Introduction to quantities 1-10 using red and blue rods. Foundation for counting and number recognition.',
        category: LESSON_CATEGORIES.MATHEMATICS,
        estimatedDuration: 25,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Spindle Box',
        description: 'Associate quantity with numeral and understand the concept of zero through hands-on manipulation.',
        category: LESSON_CATEGORIES.MATHEMATICS,
        estimatedDuration: 20,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },
      {
        title: 'Golden Beads Introduction',
        description: 'Introduction to the decimal system using concrete materials. Understanding units, tens, hundreds, and thousands.',
        category: LESSON_CATEGORIES.MATHEMATICS,
        estimatedDuration: 40,
        difficultyLevel: DIFFICULTY_LEVELS.ADVANCED,
      },

      // Cultural Studies
      {
        title: 'Land and Water Forms',
        description: 'Explore geographical concepts through hands-on work with land and water formations.',
        category: LESSON_CATEGORIES.CULTURAL,
        estimatedDuration: 30,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Continent Study',
        description: 'Learn about the seven continents through maps, globes, and cultural materials.',
        category: LESSON_CATEGORIES.CULTURAL,
        estimatedDuration: 45,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },

      // Creative Arts
      {
        title: 'Cutting Activities',
        description: 'Develop scissor skills through progressive cutting exercises from straight lines to complex shapes.',
        category: LESSON_CATEGORIES.CREATIVE_ARTS,
        estimatedDuration: 20,
        difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      },
      {
        title: 'Clay Modeling',
        description: 'Express creativity while developing hand strength and fine motor control through clay work.',
        category: LESSON_CATEGORIES.CREATIVE_ARTS,
        estimatedDuration: 35,
        difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
      },
    ];

    for (const lesson of defaultLessons) {
      await db.insert(lessons).values({
        schoolId,
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        estimatedDuration: lesson.estimatedDuration,
        difficultyLevel: lesson.difficultyLevel,
        visibility: LESSON_VISIBILITY.ADMIN_GLOBAL,
        isTemplate: false,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      });
    }

    console.log(`✓ Successfully seeded ${defaultLessons.length} default global lessons`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding lessons:', error);
    process.exit(1);
  }
}

seedLessonsOnly();
