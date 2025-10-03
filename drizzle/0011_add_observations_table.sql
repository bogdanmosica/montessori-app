-- Add observations table for teacher notes about student progress
CREATE TABLE IF NOT EXISTS "observations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
  "teacher_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "note" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS "observations_student_id_idx" ON "observations" ("student_id");
CREATE INDEX IF NOT EXISTS "observations_teacher_id_idx" ON "observations" ("teacher_id");
CREATE INDEX IF NOT EXISTS "observations_student_created_at_idx" ON "observations" ("student_id", "created_at" DESC);

-- Add constraint to ensure note is not empty
ALTER TABLE "observations" ADD CONSTRAINT "observations_note_not_empty" CHECK (length(trim("note")) > 0);
