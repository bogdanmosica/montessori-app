CREATE TABLE "applications_new" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"parent_name" varchar(255) NOT NULL,
	"parent_email" varchar(255) NOT NULL,
	"parent_phone" varchar(20),
	"child_name" varchar(255) NOT NULL,
	"child_date_of_birth" timestamp NOT NULL,
	"child_gender" varchar(10),
	"program_requested" varchar(100) NOT NULL,
	"preferred_start_date" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"approved_at" timestamp,
	"approved_by" integer,
	"rejected_at" timestamp,
	"rejected_by" integer,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications_new" ADD CONSTRAINT "applications_new_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications_new" ADD CONSTRAINT "applications_new_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications_new" ADD CONSTRAINT "applications_new_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;