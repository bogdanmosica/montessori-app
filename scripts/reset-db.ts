import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:Bogdana%231@localhost:5437/montessori_app';

async function resetDatabase() {
  console.log('🔄 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('🗑️  Dropping public schema...');
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;

    console.log('✨ Creating fresh public schema...');
    await sql`CREATE SCHEMA public`;

    console.log('✅ Database schema reset successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
