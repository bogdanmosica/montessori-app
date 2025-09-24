// Ensure all dashboard-related tables exist
import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function ensureDashboardTables() {
  console.log('Checking and creating dashboard-related tables...');
  
  try {
    // 1. Families table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS families (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id INTEGER NOT NULL REFERENCES teams(id),
        primary_contact_id INTEGER NOT NULL REFERENCES users(id),
        discount_rate INTEGER NOT NULL DEFAULT 0,
        total_monthly_fee INTEGER NOT NULL DEFAULT 0,
        payment_status payment_status NOT NULL DEFAULT 'current',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ families table checked');

    // 2. Children table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS children (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID NOT NULL REFERENCES families(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth TIMESTAMP NOT NULL,
        enrollment_status enrollment_status NOT NULL DEFAULT 'pending',
        monthly_fee INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ children table checked');

    // 3. School settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS school_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id INTEGER NOT NULL REFERENCES teams(id),
        base_fee_per_child INTEGER NOT NULL DEFAULT 65000,
        sibling_discount_rules TEXT,
        capacity_settings TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ school_settings table checked');

    // 4. Payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID NOT NULL REFERENCES families(id),
        amount INTEGER NOT NULL,
        discount_applied INTEGER NOT NULL DEFAULT 0,
        payment_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ payments table checked');

    // 5. Teacher activity table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teacher_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        school_id INTEGER NOT NULL REFERENCES teams(id),
        login_time TIMESTAMP NOT NULL,
        logout_time TIMESTAMP,
        session_duration INTEGER,
        classroom_updates INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ teacher_activity table checked');

    // Insert sample data for testing
    console.log('Creating sample data...');

    // Create a test family
    await db.execute(sql`
      INSERT INTO families (school_id, primary_contact_id, discount_rate, total_monthly_fee, payment_status)
      SELECT 1, 1, 20, 117000, 'current'
      WHERE NOT EXISTS (SELECT 1 FROM families WHERE school_id = 1 LIMIT 1);
    `);

    // Create sample children
    await db.execute(sql`
      INSERT INTO children (family_id, first_name, last_name, date_of_birth, enrollment_status, monthly_fee)
      SELECT f.id, 'John', 'Doe', '2020-01-01'::timestamp, 'enrolled', 65000
      FROM families f 
      WHERE f.school_id = 1 
      AND NOT EXISTS (SELECT 1 FROM children WHERE family_id = f.id)
      LIMIT 1;
    `);

    // Create school settings
    await db.execute(sql`
      INSERT INTO school_settings (school_id, base_fee_per_child, total_capacity, age_group_capacities)
      SELECT 1, 65000, 200, '[{"ageGroup": "Primary", "capacity": 120, "minAge": 36, "maxAge": 72}]'
      WHERE NOT EXISTS (SELECT 1 FROM school_settings WHERE school_id = 1);
    `);

    console.log('✅ Sample data created');
    
  } catch (error) {
    console.error('Error ensuring dashboard tables:', error);
    throw error;
  }
}

if (require.main === module) {
  ensureDashboardTables()
    .then(() => {
      console.log('🎉 All dashboard tables are ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { ensureDashboardTables };