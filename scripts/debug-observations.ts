import { db } from '../lib/db/drizzle';
import { observations } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function debugObservations() {
  try {
    console.log('🔍 Debugging observations table...');

    // Test table existence
    const tableExists = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'observations');`
    );
    console.log('Table exists:', tableExists);

    // Test simple count query
    try {
      const countResult = await db
        .select({ count: observations.id })
        .from(observations)
        .limit(1);
      
      console.log('Count query result:', countResult);
      console.log('Count query result type:', typeof countResult);
      console.log('First item:', countResult[0]);
      
      if (countResult[0]) {
        console.log('Count property:', countResult[0].count);
        console.log('Count property type:', typeof countResult[0].count);
      }
    } catch (error) {
      console.error('Count query error:', error);
    }

    // Test if there are any observations
    try {
      const allObservations = await db.select().from(observations).limit(5);
      console.log('Sample observations:', allObservations.length, 'found');
      console.log('Sample data:', allObservations[0]);
    } catch (error) {
      console.error('Select error:', error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugObservations();