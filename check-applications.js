const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.POSTGRES_URL);

async function checkApplications() {
  try {
    const applications = await sql`
      SELECT id, parent_name, parent_email, child_name, status, created_at
      FROM applications_new 
      WHERE school_id = 1 
      ORDER BY created_at DESC
    `;
    
    console.log('All applications in applicationsNew table:');
    console.log('=====================================');
    applications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.parent_name} (${app.child_name}) - ${app.status}`);
      console.log(`   Email: ${app.parent_email}`);
      console.log(`   Created: ${app.created_at}`);
      console.log('');
    });
    
    console.log(`Total: ${applications.length} applications`);
    
    // Check for test data patterns
    const testEmails = applications.filter(app => app.parent_email.includes('test.example.com'));
    const otherEmails = applications.filter(app => !app.parent_email.includes('test.example.com'));
    
    console.log(`Test data: ${testEmails.length} applications`);
    console.log(`Other data: ${otherEmails.length} applications`);
    
    // Show status breakdown
    const statusCounts = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkApplications();