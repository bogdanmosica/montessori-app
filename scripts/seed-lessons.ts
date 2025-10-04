import { db } from '../lib/db/drizzle';
import { lessons } from '../lib/db/schema/lessons';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedLessons() {
  console.log('Seeding Montessori lessons...');

  // Get the teacher user to set as creator
  const [teacherUser] = await db.select().from(users).where(eq(users.email, 'teacher@test.com'));

  if (!teacherUser) {
    console.error('Teacher user not found!');
    process.exit(1);
  }

  const schoolId = 1; // Assuming school ID is 1

  // Sample Montessori lessons across different categories
  const montessoriLessons = [
    {
      schoolId,
      title: 'Counting with Golden Beads',
      description: 'Introduction to counting using Montessori golden bead material. Students learn to count from 1-10.',
      category: 'Mathematics',
      estimatedDuration: 30,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Addition with Number Rods',
      description: 'Learn basic addition concepts using Montessori number rods and manipulatives.',
      category: 'Mathematics',
      estimatedDuration: 45,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Sandpaper Letters Tracing',
      description: 'Tactile learning of letter formation using sandpaper letters.',
      category: 'Language',
      estimatedDuration: 20,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Phonetic Sounds Practice',
      description: 'Introduction to phonetic sounds and letter-sound correspondence.',
      category: 'Language',
      estimatedDuration: 25,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Practical Life: Pouring Water',
      description: 'Develop fine motor skills and concentration through pouring activities.',
      category: 'Practical Life',
      estimatedDuration: 15,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Buttoning Frame Exercise',
      description: 'Practice buttoning skills using Montessori dressing frames.',
      category: 'Practical Life',
      estimatedDuration: 20,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Geometric Solids Exploration',
      description: 'Learn to identify and name 3D geometric shapes through hands-on exploration.',
      category: 'Sensorial',
      estimatedDuration: 30,
      difficultyLevel: 'intermediate' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Color Tablets Matching',
      description: 'Develop visual discrimination skills by matching color tablets.',
      category: 'Sensorial',
      estimatedDuration: 20,
      difficultyLevel: 'beginner' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Parts of a Plant',
      description: 'Learn about plant anatomy using Montessori nomenclature cards and real specimens.',
      category: 'Science',
      estimatedDuration: 35,
      difficultyLevel: 'intermediate' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
    {
      schoolId,
      title: 'Continent Map Work',
      description: 'Introduction to world geography using Montessori puzzle maps.',
      category: 'Geography',
      estimatedDuration: 30,
      difficultyLevel: 'intermediate' as const,
      isTemplate: false,
      createdBy: teacherUser.id,
      updatedBy: teacherUser.id,
    },
  ];

  // Insert lessons
  const createdLessons = await db.insert(lessons).values(montessoriLessons).returning();

  console.log(`✅ Successfully created ${createdLessons.length} Montessori lessons:`);
  createdLessons.forEach((lesson) => {
    console.log(`  - ${lesson.title} (${lesson.category})`);
  });
}

seedLessons()
  .catch((error) => {
    console.error('Failed to seed lessons:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done!');
    process.exit(0);
  });
