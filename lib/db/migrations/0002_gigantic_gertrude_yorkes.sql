CREATE TYPE "public"."lesson_visibility" AS ENUM('admin_global', 'teacher_private');--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "title" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "visibility" "lesson_visibility" DEFAULT 'teacher_private' NOT NULL;