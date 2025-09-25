// Script to add test applications data
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function addTestApplications() {
  try {
    console.log('Adding test applications...');
    
    // Insert test applications directly into applications_new table
    await sql`
      INSERT INTO applications_new (
        school_id, parent_name, parent_email, parent_phone,
        child_name, child_date_of_birth, child_gender,
        program_requested, preferred_start_date, status,
        notes, created_at, updated_at
      ) VALUES 
      (
        1, 'John Smith', 'john.smith@email.com', '555-0101',
        'Emma Smith', '2020-03-15', 'female',
        'Toddler Program', '2024-09-01', 'pending',
        'Emma is very social and loves to play with other children.',
        NOW(), NOW()
      ),
      (
        1, 'Sarah Johnson', 'sarah.j@email.com', '555-0102',
        'Liam Johnson', '2019-11-22', 'male',
        'Pre-K Program', '2024-09-01', 'pending',
        'Liam has experience with basic reading and counting.',
        NOW(), NOW()
      ),
      (
        1, 'Michael Brown', 'mike.brown@email.com', '555-0103',
        'Olivia Brown', '2021-01-08', 'female',
        'Infant Program', '2024-10-01', 'approved',
        'Olivia is our first child and we are excited to start.',
        NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
      ),
      (
        1, 'Jennifer Davis', 'jen.davis@email.com', '555-0104',
        'Noah Davis', '2020-07-30', 'male',
        'Toddler Program', '2024-08-15', 'rejected',
        'Noah needs additional support that we cannot provide at this time.',
        NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
      );
    `;
    
    console.log('Test applications added successfully!');
    
    // Check the count
    const count = await sql`SELECT COUNT(*) FROM applications_new`;
    console.log('Total applications:', count[0].count);
    
  } catch (error) {
    console.error('Error adding test applications:', error.message);
  } finally {
    await sql.end();
  }
}

addTestApplications();