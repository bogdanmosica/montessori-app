import { sql } from 'drizzle-orm';
import { db } from '../lib/db/drizzle';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running teachers table migration...');

    const migrationPath = path.join(process.cwd(), 'drizzle', '0010_add_teachers_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      await db.execute(sql.raw(statement));
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
