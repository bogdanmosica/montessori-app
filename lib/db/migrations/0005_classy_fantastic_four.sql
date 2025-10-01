ALTER TABLE "teams" ADD COLUMN "default_monthly_fee_ron" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "free_enrollment_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "settings_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "monthly_fee_override" integer;