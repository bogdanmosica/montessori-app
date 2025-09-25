// Simple script to debug applications table
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function debugApplications() {
  try {
    console.log('Checking applications table...');
    
    // Check if applications table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'applications'
      );
    `;
    console.log('Applications table exists:', tableExists[0].exists);
    
    // Check if applications_new table exists  
    const tableNewExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'applications_new'
      );
    `;
    console.log('Applications_new table exists:', tableNewExists[0].exists);
    
    // Try to get some data from applications table
    const applicationsData = await sql`SELECT COUNT(*) FROM applications`;
    console.log('Applications count:', applicationsData[0].count);
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await sql.end();
  }
}

debugApplications();