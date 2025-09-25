const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.POSTGRES_URL);

async function cleanUpApplications() {
  try {
    console.log('Cleaning up duplicate applications...');
    
    // Delete all existing applications first
    await sql`DELETE FROM applications_new WHERE school_id = 1`;
    console.log('Deleted all existing applications');
    
    // Add a clean set of test applications
    await sql`
      INSERT INTO applications_new (
        school_id, parent_name, parent_email, parent_phone,
        child_name, child_date_of_birth, child_gender,
        program_requested, preferred_start_date, status,
        notes, approved_at, approved_by, rejected_at, rejected_by,
        rejection_reason, created_at, updated_at
      ) VALUES 
      -- Pending applications
      (
        1, 'Alice Johnson', 'alice.johnson@example.com', '555-0101',
        'Emma Johnson', '2020-03-15', 'female',
        'Pre-K Program', '2025-09-01', 'pending',
        'Emma is very social and loves to play with other children.',
        NULL, NULL, NULL, NULL, NULL,
        '2025-09-20 10:30:00', '2025-09-20 10:30:00'
      ),
      (
        1, 'Michael Smith', 'michael.smith@example.com', '555-0102',
        'Oliver Smith', '2021-07-22', 'male',
        'Toddler Program', '2025-10-15', 'pending',
        'Looking for full-time care, very active child.',
        NULL, NULL, NULL, NULL, NULL,
        '2025-09-22 14:15:00', '2025-09-22 14:15:00'
      ),
      -- Approved application
      (
        1, 'Sarah Wilson', 'sarah.wilson@example.com', '555-0103',
        'Sophia Wilson', '2019-11-08', 'female',
        'Kindergarten Prep', '2025-08-25', 'approved',
        'Approved - excellent interview, child ready for kindergarten prep.',
        '2025-09-23 09:45:00', 1, NULL, NULL, NULL,
        '2025-09-18 16:20:00', '2025-09-23 09:45:00'
      ),
      -- Rejected application
      (
        1, 'David Martinez', 'david.martinez@example.com', '555-0104',
        'Lucas Martinez', '2020-12-30', 'male',
        'Pre-K Program', '2025-09-15', 'rejected',
        'Placed on waitlist for next enrollment period.',
        NULL, NULL, '2025-09-24 11:30:00', 1,
        'Program is currently at capacity for this age group',
        '2025-09-21 13:45:00', '2025-09-24 11:30:00'
      )
    `;
    
    console.log('Added clean set of 4 test applications');
    
    // Verify the data
    const applications = await sql`
      SELECT parent_name, child_name, status, created_at
      FROM applications_new 
      WHERE school_id = 1 
      ORDER BY created_at ASC
    `;
    
    console.log('\nCurrent applications:');
    console.log('===================');
    applications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.parent_name} (${app.child_name}) - ${app.status}`);
    });
    
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count 
      FROM applications_new 
      WHERE school_id = 1 
      GROUP BY status
      ORDER BY status
    `;
    
    console.log('\nStatus breakdown:');
    statusCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    console.log(`\nTotal: ${applications.length} applications`);
    
  } catch (error) {
    console.error('Error cleaning up applications:', error);
  } finally {
    await sql.end();
  }
}

cleanUpApplications();