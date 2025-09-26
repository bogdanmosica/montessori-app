CREATE TYPE "public"."access_log_action" AS ENUM('APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'CHILD_CREATED', 'APPLICATION_VIEWED');--> statement-breakpoint
CREATE TYPE "public"."access_log_target" AS ENUM('APPLICATION', 'CHILD', 'PARENT');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."child_enrollment_status" AS ENUM('ACTIVE', 'INACTIVE', 'WAITLISTED');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');--> statement-breakpoint
CREATE TABLE "admin_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"admin_user_id" integer NOT NULL,
	"action_type" "access_log_action" NOT NULL,
	"target_type" "access_log_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "parent_child_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"primary_contact" boolean DEFAULT false NOT NULL,
	"pickup_authorized" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"emergency_contact" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_child_id_children_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "children" DROP CONSTRAINT "children_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" SET DATA TYPE "public"."child_enrollment_status" USING "enrollment_status"::text::"public"."child_enrollment_status";--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "processed_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "processed_by_admin_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "child_first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "child_last_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "child_date_of_birth" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "child_gender" varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "preferred_start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "special_needs" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "medical_conditions" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent1_first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent1_last_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent1_email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent1_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent1_relationship" "relationship_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent2_first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent2_last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent2_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent2_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "parent2_relationship" "relationship_type";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "school_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "gender" varchar(50);--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "special_needs" text;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "medical_conditions" text;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "created_by_admin_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_access_logs" ADD CONSTRAINT "admin_access_logs_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_access_logs" ADD CONSTRAINT "admin_access_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_parent_id_parent_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_processed_by_admin_id_users_id_fk" FOREIGN KEY ("processed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "child_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "reviewed_at";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "reviewed_by";--> statement-breakpoint
ALTER TABLE "children" DROP COLUMN "family_id";--> statement-breakpoint
ALTER TABLE "children" DROP COLUMN "monthly_fee";