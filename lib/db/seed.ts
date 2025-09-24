import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { UserRole } from '@/lib/constants/user-roles';

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

async function seed() {
  console.log('Creating test team...');
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Montessori Test School',
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

  console.log('Assigning users to team...');

  // Add all users to the team
  await db.insert(teamMembers).values([
    {
      teamId: team.id,
      userId: adminUser.id,
      role: 'admin',
    },
    {
      teamId: team.id,
      userId: teacherUser.id,
      role: 'teacher',
    },
    {
      teamId: team.id,
      userId: parentUser.id,
      role: 'parent',
    },
  ]);

  console.log('Test users created:');
  console.log('  Admin: admin@test.com / admin123');
  console.log('  Teacher: teacher@test.com / teacher123');
  console.log('  Parent: parent@test.com / parent123');

  await createStripeProducts();
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
