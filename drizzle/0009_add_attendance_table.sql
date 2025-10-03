-- Attendance tracking table for teachers
-- Supports single teacher and co-teaching consensus workflows
-- Multi-tenant scoped with proper foreign key relationships

-- Create attendance status enum
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'pending_present',
  'pending_absent',
  'confirmed_present',
  'confirmed_absent'
);

--> statement-breakpoint

-- Main attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  tenant_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Composite unique constraint: one attendance record per student per teacher per date
  CONSTRAINT unique_student_teacher_date UNIQUE(student_id, teacher_id, date)
);

--> statement-breakpoint

-- Performance indexes for common queries

-- Composite index for teacher's daily roster queries (most common use case)
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);

--> statement-breakpoint

-- Composite index for student attendance history
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date DESC);

--> statement-breakpoint

-- Tenant isolation index (multi-tenancy security)
CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id);

--> statement-breakpoint

-- Date index for range queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

--> statement-breakpoint

-- Composite index for pending consensus queries (co-teaching workflow)
CREATE INDEX IF NOT EXISTS idx_attendance_status_date ON attendance(status, date DESC)
  WHERE status IN ('pending_present', 'pending_absent');
