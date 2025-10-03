# Data Model: Teacher Progress Board

## Core Entities

### LessonProgress
Represents the relationship between a lesson and optionally a student with current progress status.

**Fields**:
- `id`: Primary key (UUID)
- `school_id`: Foreign key to schools table (multi-tenant scoping) - NOT NULL
- `teacher_id`: Foreign key to users table (creator/owner) - NOT NULL
- `lesson_id`: Foreign key to lessons table - NOT NULL
- `student_id`: Foreign key to children table (nullable for template cards)
- `status`: Enum (not_started, in_progress, completed, on_hold) - NOT NULL
- `position`: Integer for ordering within status column - NOT NULL
- `locked_by`: Foreign key to users table (for concurrent access protection) - NULL
- `locked_at`: Timestamp of lock creation - NULL
- `created_at`: Timestamp - NOT NULL
- `updated_at`: Timestamp - NOT NULL
- `created_by`: Foreign key to users table - NOT NULL
- `updated_by`: Foreign key to users table - NOT NULL

**Indexes**:
- Primary: `id`
- Composite: `(school_id, teacher_id, status, position)` for board queries
- Composite: `(school_id, student_id)` for student filtering
- Single: `(locked_by, locked_at)` for lock management
- Single: `lesson_id` for lesson cascading
- Single: `updated_at` for change tracking

**Constraints**:
- `status` ENUM constraint
- `position` >= 0
- `locked_at` must be NULL when `locked_by` is NULL
- `student_id` can be NULL (template cards)
- Unique constraint on `(lesson_id, student_id)` where student_id IS NOT NULL

### Lesson (Extended)
Existing entity enhanced for progress tracking.

**Additional Fields**:
- `category`: String for lesson categorization (for filtering) - NOT NULL
- `estimated_duration`: Integer (minutes) for planning - NULL
- `difficulty_level`: Enum (beginner, intermediate, advanced) - NOT NULL
- `is_template`: Boolean (admin vs teacher created) - NOT NULL, DEFAULT false
- `template_parent_id`: Foreign key to lessons (for teacher customization) - NULL

**New Indexes**:
- Single: `category` for filtering
- Single: `(is_template, template_parent_id)` for template hierarchy

### ProgressColumn (New)
Admin-configured column templates for different schools.

**Fields**:
- `id`: Primary key (UUID)
- `school_id`: Foreign key to schools table - NOT NULL
- `name`: String (display name) - NOT NULL
- `status_value`: String (maps to LessonProgress.status) - NOT NULL
- `position`: Integer for column ordering - NOT NULL
- `color`: String (hex color for UI) - NOT NULL, DEFAULT '#6B7280'
- `is_active`: Boolean - NOT NULL, DEFAULT true
- `created_at`: Timestamp - NOT NULL
- `updated_at`: Timestamp - NOT NULL

**Indexes**:
- Primary: `id`
- Composite: `(school_id, position)` for column ordering
- Single: `status_value` for mapping

**Constraints**:
- `position` >= 0
- `color` must be valid hex color format
- Unique constraint on `(school_id, status_value)`
- Unique constraint on `(school_id, position)` where is_active = true

### AccessLog (Extended)
Existing audit table enhanced for progress board actions.

**Additional Actions**:
- `LESSON_PROGRESS_MOVED`: Card moved between columns
- `LESSON_PROGRESS_LOCKED`: Card locked for editing
- `LESSON_PROGRESS_UNLOCKED`: Card unlocked
- `LESSON_PROGRESS_CREATED`: New assignment created
- `LESSON_PROGRESS_DELETED`: Assignment removed

## Relationships

### LessonProgress Relationships
- **Belongs to** School (`school_id` → `schools.id`)
- **Belongs to** Teacher (`teacher_id` → `users.id`)
- **Belongs to** Lesson (`lesson_id` → `lessons.id`)
- **Belongs to** Student (`student_id` → `children.id`) - Optional
- **Belongs to** Locker (`locked_by` → `users.id`) - Optional

### Lesson Relationships (Enhanced)
- **Has many** LessonProgress entries
- **Belongs to** Template Parent (`template_parent_id` → `lessons.id`) - Optional
- **Has many** Template Children (reverse of above)

### ProgressColumn Relationships
- **Belongs to** School (`school_id` → `schools.id`)
- **Maps to** LessonProgress status via `status_value`

## State Transitions

### LessonProgress Status Flow
```
not_started → in_progress → completed
     ↓            ↓            ↑
   on_hold ←──────┴────────────┘
```

**Valid Transitions**:
- `not_started` → `in_progress`, `on_hold`
- `in_progress` → `completed`, `on_hold`, `not_started`
- `completed` → `in_progress` (for corrections)
- `on_hold` → `not_started`, `in_progress`

### Lock State Management
- Lock expires after 5 minutes of inactivity
- Only the locking user can unlock manually
- System auto-unlocks on session end
- Failed operations automatically unlock

## Validation Rules

### Business Rules
- Teacher can only access progress entries for their school
- Student assignments must reference valid enrolled students
- Template cards (student_id = NULL) are teacher-scoped
- Position values must be unique within (teacher_id, status) scope
- Locks cannot exceed 5-minute TTL

### Data Integrity
- All foreign keys must reference existing records
- Cascade delete: Lesson deletion removes all progress entries
- Soft delete: Student withdrawal marks progress as inactive
- Audit trail: All changes logged to access_logs

### Performance Constraints
- Maximum 1000 progress entries per teacher per status
- Maximum 10 concurrent locks per teacher
- Lock cleanup job runs every minute
- Position rebalancing on bulk operations

## Database Schema (Drizzle ORM)

```typescript
// New enum for lesson progress status
export const lessonProgressStatus = pgEnum('lesson_progress_status', [
  'not_started',
  'in_progress', 
  'completed',
  'on_hold'
]);

// New table for lesson progress tracking
export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  studentId: uuid('student_id').references(() => children.id),
  status: lessonProgressStatus('status').notNull(),
  position: integer('position').notNull(),
  lockedBy: uuid('locked_by').references(() => users.id),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id)
}, (table) => ({
  schoolTeacherStatusIdx: index('lesson_progress_school_teacher_status_idx')
    .on(table.schoolId, table.teacherId, table.status, table.position),
  schoolStudentIdx: index('lesson_progress_school_student_idx')
    .on(table.schoolId, table.studentId),
  lockIdx: index('lesson_progress_lock_idx')
    .on(table.lockedBy, table.lockedAt),
  uniqueLessonStudent: unique('lesson_progress_lesson_student_unique')
    .on(table.lessonId, table.studentId)
}));

// New table for progress column configuration
export const progressColumns = pgTable('progress_columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  name: varchar('name', { length: 100 }).notNull(),
  statusValue: varchar('status_value', { length: 50 }).notNull(),
  position: integer('position').notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#6B7280'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  schoolPositionIdx: index('progress_columns_school_position_idx')
    .on(table.schoolId, table.position),
  uniqueSchoolStatus: unique('progress_columns_school_status_unique')
    .on(table.schoolId, table.statusValue),
  uniqueSchoolPosition: unique('progress_columns_school_position_unique')
    .on(table.schoolId, table.position)
}));
```