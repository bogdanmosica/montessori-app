# Data Model: Attendance & Daily Logs

## Entity Definitions

### Attendance Entity
Primary entity for storing attendance records and daily notes.

**Table**: `attendance`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for attendance record |
| `student_id` | UUID | NOT NULL, FOREIGN KEY → children.id | Reference to student (child) |
| `teacher_id` | UUID | NOT NULL, FOREIGN KEY → users.id | Reference to teacher who recorded attendance |
| `date` | DATE | NOT NULL | Date of attendance (ISO format: YYYY-MM-DD) |
| `status` | ENUM | NOT NULL | Attendance status (see enum below) |
| `notes` | TEXT | NULLABLE | Free-form daily notes (JSON stored as text) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |
| `tenant_id` | UUID | NOT NULL, FOREIGN KEY → schools.id | Multi-tenant scoping |

### Attendance Status Enum
**Enum**: `attendance_status`

| Value | Description | Workflow State |
|-------|-------------|----------------|
| `present` | Student confirmed present | Final state (single teacher) |
| `absent` | Student confirmed absent | Final state (single teacher) |
| `pending_present` | Awaiting co-teacher confirmation for present | Intermediate state |
| `pending_absent` | Awaiting co-teacher confirmation for absent | Intermediate state |
| `confirmed_present` | All co-teachers agree: present | Final state (co-teaching) |
| `confirmed_absent` | All co-teachers agree: absent | Final state (co-teaching) |

## Relationships

### Primary Relationships
- **Attendance → Children**: `attendance.student_id` → `children.id` (Many-to-One)
- **Attendance → Users**: `attendance.teacher_id` → `users.id` (Many-to-One)  
- **Attendance → Schools**: `attendance.tenant_id` → `schools.id` (Many-to-One)

### Derived Relationships
- **Teacher → Students**: Via existing enrollment relationships
- **School → Attendance**: Via tenant scoping for multi-tenant isolation

## Constraints & Business Rules

### Uniqueness Constraints
- **Composite Unique**: `(student_id, teacher_id, date)` - One attendance record per student per teacher per date
- **Note**: Co-teaching scenarios create multiple records (one per teacher) that require consensus

### Validation Rules
- **Date Range**: Date must be within reasonable bounds (not future, not more than 1 year past)
- **Teacher-Student Association**: Teacher must have permission to record attendance for student
- **Tenant Scoping**: All queries must include tenant_id filter
- **Status Transitions**: Valid state transitions for co-teaching consensus workflow

### Co-Teaching Consensus Logic
1. **Single Teacher**: Direct `present`/`absent` status
2. **Co-Teaching**: 
   - First teacher sets `pending_present`/`pending_absent`
   - Subsequent teachers confirm or modify
   - Final consensus updates to `confirmed_present`/`confirmed_absent`

## Indexes for Performance

### Primary Indexes
```sql
-- Composite index for teacher's daily roster queries
CREATE INDEX idx_attendance_teacher_date ON attendance(teacher_id, date);

-- Composite index for student attendance history
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date DESC);

-- Tenant isolation index (multi-tenancy)
CREATE INDEX idx_attendance_tenant ON attendance(tenant_id);
```

### Query Optimization
- **Daily Roster Query**: `(teacher_id, date)` index supports main use case
- **Student History**: `(student_id, date DESC)` for chronological attendance records
- **Tenant Filtering**: Separate tenant index for security-critical queries

## Data Retention & Compliance

### Retention Policy
- **Active Period**: 7 years from record creation
- **Compliance Metadata**: `created_at` timestamp tracks retention eligibility
- **Archival Strategy**: Passive retention (no active deletion during compliance period)

### Audit Trail
- **Change Tracking**: `created_at`, `updated_at` timestamps
- **User Attribution**: `teacher_id` identifies who made each entry
- **Access Logging**: Separate `access_logs` table for compliance (existing system)

## Migration Strategy

### Database Schema Addition
```sql
-- Attendance status enum
CREATE TYPE attendance_status AS ENUM (
  'present', 'absent', 
  'pending_present', 'pending_absent',
  'confirmed_present', 'confirmed_absent'
);

-- Main attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES children(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES schools(id),
  
  -- Constraints
  UNIQUE(student_id, teacher_id, date)
);

-- Performance indexes
CREATE INDEX idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date DESC);
CREATE INDEX idx_attendance_tenant ON attendance(tenant_id);
```

### Drizzle ORM Schema
Integration with existing `lib/db/schema.ts`:

```typescript
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present', 'absent', 
  'pending_present', 'pending_absent',
  'confirmed_present', 'confirmed_absent'
]);

export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => children.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  tenantId: uuid('tenant_id').notNull().references(() => schools.id),
}, (table) => ({
  uniqueStudentTeacherDate: unique().on(table.studentId, table.teacherId, table.date),
  teacherDateIdx: index().on(table.teacherId, table.date),
  studentDateIdx: index().on(table.studentId, table.date),
  tenantIdx: index().on(table.tenantId),
}));
```