-- Teachers table for multi-tenant teacher management
-- Separate from users table to support teacher-specific attributes
-- Links to users table for authentication and authorization

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create teacher_student_assignments table for roster management
CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  class_group VARCHAR(100),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Index for teacher lookups by user_id
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

--> statement-breakpoint

-- Index for teacher lookups by school_id
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);

--> statement-breakpoint

-- Index for student assignments by teacher
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON teacher_student_assignments(teacher_id);

--> statement-breakpoint

-- Index for student assignments by student
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON teacher_student_assignments(student_id);

--> statement-breakpoint

-- Composite index for active assignments
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_active ON teacher_student_assignments(teacher_id, is_active);
