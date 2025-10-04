import postgres from 'postgres';

// Connect to postgres database (not montessori_app)
const connectionString = 'postgresql://postgres:Bogdana%231@localhost:5437/postgres';

async function createDatabase() {
  console.log('🔄 Connecting to postgres database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('🗑️  Dropping existing montessori_app database if exists...');
    await sql`DROP DATABASE IF EXISTS montessori_app`;

    console.log('✨ Creating montessori_app database...');
    await sql`CREATE DATABASE montessori_app`;

    console.log('✅ Database created successfully!');
  } catch (error) {
    console.error('❌ Error creating database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createDatabase();
