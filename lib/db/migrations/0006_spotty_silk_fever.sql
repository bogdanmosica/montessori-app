CREATE TYPE "public"."staff_activity_type" AS ENUM('hire', 'promotion', 'training', 'evaluation', 'departure');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('meeting', 'ceremony', 'training', 'social', 'academic');--> statement-breakpoint
CREATE TYPE "public"."payment_activity_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_activity_type" AS ENUM('tuition', 'registration', 'materials', 'other');--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'PARENT_LINKED';--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'PARENT_UNLINKED';--> statement-breakpoint
CREATE TABLE "staff_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"activity_type" "staff_activity_type" NOT NULL,
	"activity_date" timestamp NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_type" "event_type" NOT NULL,
	"event_date" timestamp NOT NULL,
	"participant_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer NOT NULL,
	"child_id" uuid,
	"activity_type" "payment_activity_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"status" "payment_activity_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "maximum_capacity" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "staff_activities" ADD CONSTRAINT "staff_activities_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_activities" ADD CONSTRAINT "staff_activities_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_activities" ADD CONSTRAINT "payment_activities_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_activities" ADD CONSTRAINT "payment_activities_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;