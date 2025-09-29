CREATE TYPE "public"."access_log_action" AS ENUM('APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'CHILD_CREATED', 'APPLICATION_VIEWED');--> statement-breakpoint
CREATE TYPE "public"."access_log_target" AS ENUM('APPLICATION', 'CHILD', 'PARENT');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."child_enrollment_status" AS ENUM('ACTIVE', 'INACTIVE', 'WAITLISTED');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."enrollment_management_status" AS ENUM('active', 'inactive', 'withdrawn', 'archived');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe_card', 'stripe_bank', 'bank_transfer', 'ach');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('card', 'bank_account', 'ach');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."line_item_type" AS ENUM('tuition', 'fees', 'supplies', 'activities', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_action" AS ENUM('view_payments', 'process_refund', 'update_method', 'download_invoice', 'view_dashboard', 'resolve_alert');--> statement-breakpoint
CREATE TABLE "admin_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"admin_user_id" integer NOT NULL,
	"action_type" "access_log_action" NOT NULL,
	"target_type" "access_log_target" NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "enrollments" (
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
	"updated_by" integer NOT NULL,
	CONSTRAINT "unique_enrollment_per_child" UNIQUE("child_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"stripe_payment_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"failure_reason" text,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_id" uuid NOT NULL,
	"stripe_payment_method_id" text,
	"payment_type" "payment_type" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"last_four" text NOT NULL,
	"brand" text NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"stripe_invoice_id" text,
	"pdf_url" text,
	"sent_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"item_type" "line_item_type" NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_id" uuid,
	"payment_id" uuid,
	"alert_type" "alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extended_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"team_id" integer,
	"route" text NOT NULL,
	"success" boolean NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"payment_id" uuid,
	"payment_action" "payment_action",
	"amount_affected" numeric(10, 2)
);
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_child_id_children_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "children" DROP CONSTRAINT "children_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'parent'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('parent', 'teacher', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'parent'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" SET DATA TYPE "public"."child_enrollment_status" USING "enrollment_status"::text::"public"."child_enrollment_status";--> statement-breakpoint
ALTER TABLE "children" ALTER COLUMN "enrollment_status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
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
ALTER TABLE "applications" ADD COLUMN "processed_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "processed_by_admin_id" integer;--> statement-breakpoint
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
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_parent_id_parent_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_parent_id_parent_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parent_id_parent_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_alerts" ADD CONSTRAINT "payment_alerts_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_alerts" ADD CONSTRAINT "payment_alerts_parent_id_parent_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_alerts" ADD CONSTRAINT "payment_alerts_payment_id_payment_records_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_alerts" ADD CONSTRAINT "payment_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extended_access_logs" ADD CONSTRAINT "extended_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extended_access_logs" ADD CONSTRAINT "extended_access_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extended_access_logs" ADD CONSTRAINT "extended_access_logs_payment_id_payment_records_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollments_school_status_date_idx" ON "enrollments" USING btree ("school_id","status","enrollment_date");--> statement-breakpoint
CREATE INDEX "enrollments_child_id_idx" ON "enrollments" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "enrollments_created_by_idx" ON "enrollments" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_processed_by_admin_id_users_id_fk" FOREIGN KEY ("processed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "child_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "reviewed_at";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "reviewed_by";--> statement-breakpoint
ALTER TABLE "children" DROP COLUMN "family_id";