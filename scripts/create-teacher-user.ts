/**
 * Script to create a test teacher user
 * Run with: npx tsx scripts/create-teacher-user.ts
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function createTeacherUser() {
  try {
    console.log('Creating teacher user...');

    const email = 'teacher@test.com';
    const password = 'teacher123';

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      console.log(`Teacher user already exists with email: ${email}`);
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Role: ${existingUser.role}`);
      return;
    }

    // Create teacher user
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name: 'Test Teacher',
      role: 'teacher',
      emailVerified: new Date(),
    }).returning();

    console.log('✅ Teacher user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log(`User ID: ${newUser.id}`);
    console.log(`Role: ${newUser.role}`);
    console.log('');
    console.log('You can now log in with these credentials to access /teacher/dashboard');

  } catch (error) {
    console.error('Error creating teacher user:', error);
    throw error;
  }
}

createTeacherUser()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
