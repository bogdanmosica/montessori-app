import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import {
  users,
  schools,
  schoolMembers,
  families,
  children,
  applications,
  securityAlerts,
  teacherActivity,
  payments,
  teachers,
  teacherStudentAssignments
} from './schema';
import { lessons } from './schema/lessons';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/session';
import { UserRole } from '@/lib/constants/user-roles';
import { DEFAULT_AGE_GROUPS } from '@/app/admin/dashboard/constants';
import { seedProgressColumnsForSchool } from '@/scripts/seed/progress-columns';
import { LESSON_CATEGORIES, LESSON_VISIBILITY, DIFFICULTY_LEVELS } from '@/lib/constants/lessons';

async function seedDefaultLessons(schoolId: number, adminUserId: number) {
  console.log('Seeding default global lessons...');

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

  console.log(`✓ Seeded ${defaultLessons.length} default global lessons`);
}

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seedDashboardData(schoolId: number, adminUserId: number, teacherUserId: number, parentUserId: number) {
  console.log('School settings already included in schools table...');
  console.log('Creating sample families and children...');

  // Create families with different configurations
  const family1 = await db.insert(families).values({
    schoolId: schoolId,
    primaryContactId: parentUserId,
    discountRate: 0, // Single child family
    totalMonthlyFee: 65000, // $650
    paymentStatus: 'current',
  }).returning();

  const family2 = await db.insert(families).values({
    schoolId: schoolId,
    primaryContactId: parentUserId,
    discountRate: 20, // 20% discount on second child
    totalMonthlyFee: 117000, // $650 + ($650 * 0.8) = $1170
    paymentStatus: 'current',
  }).returning();

  const family3 = await db.insert(families).values({
    schoolId: schoolId,
    primaryContactId: parentUserId,
    discountRate: 25, // 20% on 2nd, 30% on 3rd child
    totalMonthlyFee: 162500, // $650 + ($650 * 0.8) + ($650 * 0.7) = $1625
    paymentStatus: 'pending',
  }).returning();

  // Create children for families
  const now = new Date();

  // Single child family
  await db.insert(children).values({
    schoolId: schoolId,
    familyId: family1[0].id,
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: new Date(now.getFullYear() - 4, 3, 15), // 4 years old
    enrollmentStatus: 'ACTIVE',
    monthlyFee: 65000,
    startDate: new Date(now.getFullYear() - 3, 8, 1), // Started 3 years ago
    createdByAdminId: adminUserId,
  });

  // Two-child family
  await db.insert(children).values([
    {
      schoolId: schoolId,
      familyId: family2[0].id,
      firstName: 'Liam',
      lastName: 'Smith',
      dateOfBirth: new Date(now.getFullYear() - 5, 7, 22), // 5 years old
      enrollmentStatus: 'ACTIVE',
      monthlyFee: 65000,
      startDate: new Date(now.getFullYear() - 4, 8, 1),
      createdByAdminId: adminUserId,
    },
    {
      schoolId: schoolId,
      familyId: family2[0].id,
      firstName: 'Sophia',
      lastName: 'Smith',
      dateOfBirth: new Date(now.getFullYear() - 3, 1, 10), // 3 years old
      enrollmentStatus: 'ACTIVE',
      monthlyFee: 52000, // $650 * 0.8
      startDate: new Date(now.getFullYear() - 2, 8, 1),
      createdByAdminId: adminUserId,
    },
  ]);

  // Three-child family
  await db.insert(children).values([
    {
      schoolId: schoolId,
      familyId: family3[0].id,
      firstName: 'Noah',
      lastName: 'Brown',
      dateOfBirth: new Date(now.getFullYear() - 7, 9, 5), // 7 years old
      enrollmentStatus: 'ACTIVE',
      monthlyFee: 65000,
      startDate: new Date(now.getFullYear() - 6, 8, 1),
      createdByAdminId: adminUserId,
    },
    {
      schoolId: schoolId,
      familyId: family3[0].id,
      firstName: 'Olivia',
      lastName: 'Brown',
      dateOfBirth: new Date(now.getFullYear() - 4, 11, 18), // 4 years old
      enrollmentStatus: 'ACTIVE',
      monthlyFee: 52000, // $650 * 0.8
      startDate: new Date(now.getFullYear() - 3, 8, 1),
      createdByAdminId: adminUserId,
    },
    {
      schoolId: schoolId,
      familyId: family3[0].id,
      firstName: 'Ethan',
      lastName: 'Brown',
      dateOfBirth: new Date(now.getFullYear() - 2, 6, 30), // 2 years old
      enrollmentStatus: 'ACTIVE',
      monthlyFee: 45500, // $650 * 0.7
      startDate: new Date(now.getFullYear() - 1, 8, 1),
      createdByAdminId: adminUserId,
    },
  ]);

  console.log('Creating teacher record...');

  // Create teacher record in teachers table
  const [teacher] = await db.insert(teachers).values({
    userId: teacherUserId,
    schoolId: schoolId,
    firstName: 'Teacher',
    lastName: 'User',
    email: 'teacher@test.com',
    phoneNumber: '555-0100',
    isActive: true,
    hireDate: new Date(now.getFullYear() - 2, 8, 1), // Hired 2 years ago
  }).returning();

  console.log('Assigning students to teacher...');

  // Get all children for assignments
  const allChildren = await db.select().from(children).where(eq(children.schoolId, schoolId));

  // Assign all 6 children to the teacher
  await db.insert(teacherStudentAssignments).values(
    allChildren.map(child => ({
      teacherId: teacher.id,
      studentId: child.id,
      isActive: true,
      assignedAt: new Date(now.getFullYear(), 0, 1), // Assigned at start of year
    }))
  );

  // console.log('Creating sample applications...');
  // Applications creation commented out - requires full application form data

  console.log('Creating sample teacher activity...');

  // Create teacher activity data
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (let i = 0; i < 7; i++) {
    const activityDate = new Date(weekAgo);
    activityDate.setDate(activityDate.getDate() + i);

    await db.insert(teacherActivity).values({
      schoolId: schoolId,
      userId: teacherUserId,
      sessionStart: new Date(activityDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      sessionEnd: new Date(activityDate.getTime() + 15 * 60 * 60 * 1000), // 3 PM
      sessionDuration: 360, // 6 hours
      classroomUpdates: Math.floor(Math.random() * 5) + 1,
      activityDate: activityDate,
    });
  }

  console.log('Creating sample security alerts...');

  // Create a sample security alert
  await db.insert(securityAlerts).values({
    schoolId: schoolId,
    type: 'failed_logins',
    severity: 'medium',
    message: '3 failed login attempts from IP 192.168.1.100',
    metadata: JSON.stringify({
      ipAddress: '192.168.1.100',
      userEmail: 'teacher@test.com',
      attempts: 3,
    }),
    resolved: false,
  });

  console.log('Creating sample payment records...');

  // Create payment records
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await db.insert(payments).values([
    {
      familyId: family1[0].id,
      amount: 65000,
      discountApplied: 0,
      paymentDate: currentMonth,
      status: 'completed',
    },
    {
      familyId: family2[0].id,
      amount: 117000,
      discountApplied: 13000, // $130 discount
      paymentDate: currentMonth,
      status: 'completed',
    },
    {
      familyId: family3[0].id,
      amount: 162500,
      discountApplied: 32500, // $325 discount
      paymentDate: currentMonth,
      status: 'pending',
    },
  ]);

  console.log('Dashboard seed data created successfully!');
  console.log('Sample data includes:');
  console.log('  - 3 families with 6 enrolled children');
  console.log('  - 1 pending application');
  console.log('  - 7 days of teacher activity');
  console.log('  - 1 security alert');
  console.log('  - Payment records for cashflow metrics');
}

async function seed() {
  console.log('Creating test school...');
  const [school] = await db
    .insert(schools)
    .values({
      name: 'Montessori Test School',
      // School settings (merged from schoolSettings table)
      baseFeePerChild: 65000, // $650 in cents
      totalCapacity: 200,
      waitlistLimit: 50,
      maximumCapacity: 200,
      siblingDiscountRules: JSON.stringify([
        { childCount: 2, discountType: 'percentage', discountValue: 20, appliesTo: 'additional_children' },
        { childCount: 3, discountType: 'percentage', discountValue: 30, appliesTo: 'additional_children' },
      ]),
      ageGroupCapacities: JSON.stringify([
        {
          ageGroup: 'Toddler (18-36 months)',
          minAge: 18,
          maxAge: 36,
          capacity: 40,
        },
        {
          ageGroup: 'Primary (3-6 years)',
          minAge: 37,
          maxAge: 72,
          capacity: 120,
        },
        {
          ageGroup: 'Elementary (6-12 years)',
          minAge: 73,
          maxAge: 144,
          capacity: 40,
        },
      ]),
    })
    .returning();

  console.log('Creating test users with different roles...');

  // Create admin user
  const adminPasswordHash = await hashPassword('admin123');
  const [adminUser] = await db
    .insert(users)
    .values([
      {
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        sessionVersion: 1,
      },
    ])
    .returning();

  // Create teacher user
  const teacherPasswordHash = await hashPassword('teacher123');
  const [teacherUser] = await db
    .insert(users)
    .values([
      {
        name: 'Teacher User',
        email: 'teacher@test.com',
        passwordHash: teacherPasswordHash,
        role: UserRole.TEACHER,
        sessionVersion: 1,
      },
    ])
    .returning();

  // Create parent user
  const parentPasswordHash = await hashPassword('parent123');
  const [parentUser] = await db
    .insert(users)
    .values([
      {
        name: 'Parent User',
        email: 'parent@test.com',
        passwordHash: parentPasswordHash,
        role: UserRole.PARENT,
        sessionVersion: 1,
      },
    ])
    .returning();

  console.log('Assigning users to school...');

  // Add all users to the school
  await db.insert(schoolMembers).values([
    {
      schoolId: school.id,
      userId: adminUser.id,
      role: UserRole.ADMIN,
    },
    {
      schoolId: school.id,
      userId: teacherUser.id,
      role: UserRole.TEACHER,
    },
    {
      schoolId: school.id,
      userId: parentUser.id,
      role: UserRole.PARENT,
    },
  ]);

  console.log('Test users created:');
  console.log('  Admin: admin@test.com / admin123');
  console.log('  Teacher: teacher@test.com / teacher123');
  console.log('  Parent: parent@test.com / parent123');

  await createStripeProducts();
  await seedDashboardData(school.id, adminUser.id, teacherUser.id, parentUser.id);
  await seedProgressColumnsForSchool(school.id);
  await seedDefaultLessons(school.id, adminUser.id);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
