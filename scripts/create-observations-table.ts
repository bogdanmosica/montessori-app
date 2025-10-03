import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function createObservationsTable() {
  try {
    console.log('🌱 Creating observations table...');

    // Create the observations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "observations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
        "teacher_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "note" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create indexes for optimized queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "observations_student_id_idx" ON "observations" ("student_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "observations_teacher_id_idx" ON "observations" ("teacher_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "observations_student_created_at_idx" ON "observations" ("student_id", "created_at" DESC);
    `);

    // Add constraint to ensure note is not empty
    try {
      await db.execute(sql`
        ALTER TABLE "observations" 
        ADD CONSTRAINT "observations_note_not_empty" 
        CHECK (length(trim("note")) > 0);
      `);
    } catch (error) {
      // Constraint might already exist, ignore error
      console.log('Note: Constraint might already exist');
    }

    console.log('✅ Observations table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating observations table:', error);
    process.exit(1);
  }
}

createObservationsTable();