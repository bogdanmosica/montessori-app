-- Migration: Add enrollments table for admin enrollment management
-- Date: 2025-09-27

-- Create enrollment management status enum
DO $$ BEGIN
 CREATE TYPE "public"."enrollment_management_status" AS ENUM('active', 'inactive', 'withdrawn', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create enrollments table
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"school_id" integer NOT NULL,
	"status" "enrollment_management_status" DEFAULT 'active' NOT NULL,
	"enrollment_date" timestamp NOT NULL,
	"withdrawal_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create unique constraint for active enrollments (only one active enrollment per child per school)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_enrollment_per_child" ON "enrollments" ("child_id", "school_id") WHERE "status" = 'active';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "enrollments_school_status_date_idx" ON "enrollments" ("school_id", "status", "enrollment_date");
CREATE INDEX IF NOT EXISTS "enrollments_child_id_idx" ON "enrollments" ("child_id");
CREATE INDEX IF NOT EXISTS "enrollments_created_by_idx" ON "enrollments" ("created_by");
CREATE INDEX IF NOT EXISTS "enrollments_status_idx" ON "enrollments" ("status");

-- Add updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();