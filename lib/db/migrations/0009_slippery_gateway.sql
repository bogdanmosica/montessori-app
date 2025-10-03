CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'pending_present', 'pending_absent', 'confirmed_present', 'confirmed_absent');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"teacher_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer NOT NULL,
	CONSTRAINT "unique_student_teacher_date" UNIQUE("student_id","teacher_id","date")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_children_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendance_teacher_date" ON "attendance" USING btree ("teacher_id","date");--> statement-breakpoint
CREATE INDEX "idx_attendance_student_date" ON "attendance" USING btree ("student_id","date");--> statement-breakpoint
CREATE INDEX "idx_attendance_tenant" ON "attendance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_date" ON "attendance" USING btree ("date");