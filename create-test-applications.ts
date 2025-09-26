import { db } from './lib/db/drizzle';
import { applications } from './lib/db/schema';

async function createTestData() {
  console.log('Creating test applications...');

  await db.insert(applications).values([
    {
      schoolId: 1,
      status: 'PENDING',
      childFirstName: 'Emma',
      childLastName: 'Johnson',
      childDateOfBirth: new Date('2020-03-15'),
      childGender: 'Female',
      preferredStartDate: new Date('2025-09-01'),
      parent1FirstName: 'Sarah',
      parent1LastName: 'Johnson',
      parent1Email: 'sarah.johnson@email.com',
      parent1Relationship: 'MOTHER',
      parent2FirstName: 'Mike',
      parent2LastName: 'Johnson',
      parent2Email: 'mike.johnson@email.com',
      parent2Relationship: 'FATHER',
      specialNeeds: 'None',
      medicalConditions: 'Allergic to peanuts',
    },
    {
      schoolId: 1,
      status: 'PENDING',
      childFirstName: 'Liam',
      childLastName: 'Smith',
      childDateOfBirth: new Date('2019-07-22'),
      childGender: 'Male',
      preferredStartDate: new Date('2025-09-15'),
      parent1FirstName: 'Jessica',
      parent1LastName: 'Smith',
      parent1Email: 'jessica.smith@email.com',
      parent1Relationship: 'MOTHER',
      specialNeeds: 'None',
      medicalConditions: 'None',
    },
    {
      schoolId: 1,
      status: 'APPROVED',
      childFirstName: 'Sophia',
      childLastName: 'Brown',
      childDateOfBirth: new Date('2021-01-10'),
      childGender: 'Female',
      preferredStartDate: new Date('2025-08-15'),
      parent1FirstName: 'Amy',
      parent1LastName: 'Brown',
      parent1Email: 'amy.brown@email.com',
      parent1Relationship: 'MOTHER',
      parent2FirstName: 'David',
      parent2LastName: 'Brown',
      parent2Email: 'david.brown@email.com',
      parent2Relationship: 'FATHER',
      specialNeeds: 'None',
      medicalConditions: 'Asthma - has inhaler',
    },
    {
      schoolId: 1,
      status: 'REJECTED',
      childFirstName: 'Noah',
      childLastName: 'Wilson',
      childDateOfBirth: new Date('2018-11-05'),
      childGender: 'Male',
      preferredStartDate: new Date('2025-10-01'),
      parent1FirstName: 'Lisa',
      parent1LastName: 'Wilson',
      parent1Email: 'lisa.wilson@email.com',
      parent1Relationship: 'MOTHER',
      parent2FirstName: 'John',
      parent2LastName: 'Wilson',
      parent2Email: 'john.wilson@email.com',
      parent2Relationship: 'FATHER',
      specialNeeds: 'None',
      medicalConditions: 'None',
    }
  ]);

  console.log('✅ Test applications created successfully!');
  console.log('Created applications:');
  console.log('  - Emma Johnson (PENDING)');
  console.log('  - Liam Smith (PENDING)');
  console.log('  - Sophia Brown (APPROVED)');
  console.log('  - Noah Wilson (REJECTED)');
}

createTestData()
  .catch((error) => {
    console.error('❌ Failed to create test data:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });