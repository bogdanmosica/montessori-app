ALTER TABLE "children" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_from_application" boolean DEFAULT false NOT NULL;