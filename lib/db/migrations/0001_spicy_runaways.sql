CREATE TABLE "import_error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"row_number" integer NOT NULL,
	"field" varchar(100) NOT NULL,
	"error_message" text NOT NULL,
	"row_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_error_logs" ADD CONSTRAINT "import_error_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;