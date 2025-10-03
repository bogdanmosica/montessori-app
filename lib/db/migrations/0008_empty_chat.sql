CREATE TYPE "public"."difficulty_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."lesson_progress_status" AS ENUM('not_started', 'in_progress', 'completed', 'on_hold');--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'LESSON_PROGRESS_MOVED';--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'LESSON_PROGRESS_LOCKED';--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'LESSON_PROGRESS_UNLOCKED';--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'LESSON_PROGRESS_CREATED';--> statement-breakpoint
ALTER TYPE "public"."access_log_action" ADD VALUE 'LESSON_PROGRESS_DELETED';--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"estimated_duration" integer,
	"difficulty_level" "difficulty_level" NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_parent_id" uuid,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"lesson_id" uuid NOT NULL,
	"student_id" uuid,
	"status" "lesson_progress_status" NOT NULL,
	"position" integer NOT NULL,
	"locked_by" integer,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "lesson_progress_lesson_student_unique" UNIQUE("lesson_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "progress_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"status_value" varchar(50) NOT NULL,
	"position" integer NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "progress_columns_school_status_unique" UNIQUE("school_id","status_value"),
	CONSTRAINT "progress_columns_school_position_unique" UNIQUE("school_id","position")
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_template_parent_id_lessons_id_fk" FOREIGN KEY ("template_parent_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_children_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_columns" ADD CONSTRAINT "progress_columns_school_id_teams_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lessons_school_idx" ON "lessons" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lessons_category_idx" ON "lessons" USING btree ("category");--> statement-breakpoint
CREATE INDEX "lessons_template_idx" ON "lessons" USING btree ("is_template","template_parent_id");--> statement-breakpoint
CREATE INDEX "lessons_difficulty_idx" ON "lessons" USING btree ("difficulty_level");--> statement-breakpoint
CREATE INDEX "lesson_progress_school_teacher_status_idx" ON "lesson_progress" USING btree ("school_id","teacher_id","status","position");--> statement-breakpoint
CREATE INDEX "lesson_progress_school_student_idx" ON "lesson_progress" USING btree ("school_id","student_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_lock_idx" ON "lesson_progress" USING btree ("locked_by","locked_at");--> statement-breakpoint
CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_updated_at_idx" ON "lesson_progress" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "progress_columns_school_position_idx" ON "progress_columns" USING btree ("school_id","position");--> statement-breakpoint
CREATE INDEX "progress_columns_status_idx" ON "progress_columns" USING btree ("status_value");