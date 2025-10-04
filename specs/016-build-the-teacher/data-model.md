# Data Model: Teacher Management

## Database Schema

### Teachers Table (New)
```sql
teachers (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id: uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id: uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  wage: decimal(10,2), -- Optional as per clarifications
  nationality: varchar(100), -- Optional as per clarifications
  is_active: boolean NOT NULL DEFAULT true, -- Soft deletion support
  created_at: timestamp with time zone DEFAULT now(),
  updated_at: timestamp with time zone DEFAULT now(),
  
  -- Indexes
  UNIQUE(user_id), -- One teacher record per user
  INDEX(school_id), -- Multi-tenant queries
  INDEX(school_id, is_active) -- Active teachers by school
)
```

### Teacher-Student Assignments Table (New)
```sql
teacher_students (
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id: uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id: uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  school_id: uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_at: timestamp with time zone DEFAULT now(),
  assigned_by: uuid NOT NULL REFERENCES users(id), -- Admin who made assignment
  
  -- Indexes
  UNIQUE(teacher_id, student_id), -- Prevent duplicate assignments
  INDEX(teacher_id), -- Query assignments by teacher
  INDEX(student_id), -- Query assignments by student
  INDEX(school_id) -- Multi-tenant queries
)
```

### Updated Users Table (Reference)
```sql
-- No changes needed to users table
-- Teacher accounts use existing role system:
-- role: 'ADMIN' | 'TEACHER' | 'PARENT'
```

### Updated Children Table (Reference)
```sql
-- No changes needed to children table
-- Assignments handled via junction table
```

## Entity Relationships

### Teacher Entity
- **Properties**:
  - `id`: Unique identifier
  - `userId`: Reference to user account (for auth/profile)
  - `schoolId`: Multi-tenant isolation
  - `wage`: Optional monetary compensation
  - `nationality`: Optional demographic field
  - `isActive`: Soft deletion flag
  - `createdAt`, `updatedAt`: Audit timestamps

- **Relationships**:
  - `belongsTo User` (one-to-one via userId)
  - `belongsTo School` (many-to-one via schoolId)
  - `hasMany StudentAssignments` (one-to-many)
  - `hasManyThrough Students` (many-to-many via teacher_students)

### Student Assignment Entity
- **Properties**:
  - `id`: Unique identifier
  - `teacherId`: Teacher reference
  - `studentId`: Student reference
  - `schoolId`: Multi-tenant isolation
  - `assignedAt`: Assignment timestamp
  - `assignedBy`: Admin who created assignment

- **Relationships**:
  - `belongsTo Teacher` (many-to-one)
  - `belongsTo Student (Child)` (many-to-one)
  - `belongsTo School` (many-to-one)
  - `belongsTo User (assignedBy)` (many-to-one)

## Validation Rules

### Teacher Creation
- `userId`: Required, must exist in users table, must have 'TEACHER' role
- `schoolId`: Required, must match admin's school (multi-tenant)
- `wage`: Optional, if provided must be positive decimal
- `nationality`: Optional, if provided max 100 characters
- `isActive`: Defaults to true
- Email uniqueness: Enforced at user level (prevents duplicate teacher accounts)

### Student Assignment
- `teacherId`: Required, must exist and be active
- `studentId`: Required, must exist and belong to same school
- `schoolId`: Required, must match teacher and student school
- `assignedBy`: Required, must be admin user
- Duplicate prevention: Unique constraint on (teacher_id, student_id)

### Soft Deletion Rules
- Teachers: Set `isActive = false`, preserve all data and relationships
- Student assignments: Remain intact when teacher is deactivated
- Cascade deletion: If user account deleted, teacher record is deleted (CASCADE)

## Query Patterns

### Multi-Tenant Scoping
All queries must include school-based filtering:
```sql
-- Get active teachers for school
SELECT * FROM teachers 
WHERE school_id = $schoolId AND is_active = true;

-- Get teacher assignments for school
SELECT * FROM teacher_students ts
JOIN teachers t ON ts.teacher_id = t.id
WHERE ts.school_id = $schoolId;
```

### Common Queries
1. **List Teachers with Student Counts**:
   ```sql
   SELECT t.*, u.name, u.email, COUNT(ts.student_id) as student_count
   FROM teachers t
   JOIN users u ON t.user_id = u.id
   LEFT JOIN teacher_students ts ON t.id = ts.teacher_id
   WHERE t.school_id = $schoolId
   GROUP BY t.id, u.id
   ORDER BY u.name;
   ```

2. **Get Teacher's Assigned Students**:
   ```sql
   SELECT c.*, ts.assigned_at
   FROM children c
   JOIN teacher_students ts ON c.id = ts.student_id
   WHERE ts.teacher_id = $teacherId AND ts.school_id = $schoolId;
   ```

3. **Get Student's Teachers**:
   ```sql
   SELECT t.*, u.name, u.email
   FROM teachers t
   JOIN users u ON t.user_id = u.id
   JOIN teacher_students ts ON t.id = ts.teacher_id
   WHERE ts.student_id = $studentId AND ts.school_id = $schoolId;
   ```

## State Transitions

### Teacher Lifecycle
1. **Creation**: Active teacher with user account
2. **Active**: Can be assigned students, appears in UI
3. **Inactive**: Soft deleted, assignments preserved, marked in UI
4. **Hard Delete**: User account deleted → teacher record cascades

### Assignment Lifecycle
1. **Creation**: Admin assigns student to teacher
2. **Active**: Assignment exists and functional  
3. **Removal**: Admin explicitly removes assignment
4. **Cascade**: Teacher/student deletion removes assignment

## Performance Considerations

### Indexes
- Multi-tenant queries: `(school_id, is_active)` on teachers
- Assignment lookups: `(teacher_id)`, `(student_id)` on teacher_students
- Uniqueness: `(teacher_id, student_id)` on teacher_students

### Query Optimization
- Use JOINs instead of N+1 queries for teacher lists
- Batch student assignment operations
- Consider pagination for large teacher/student lists

## Migration Strategy

### Phase 1: Schema Creation
1. Create `teachers` table
2. Create `teacher_students` table
3. Add indexes and constraints

### Phase 2: Data Migration (if needed)
1. Identify existing teacher users by role
2. Create corresponding teacher records
3. Migrate any existing teacher-student relationships

### Phase 3: Validation
1. Verify referential integrity
2. Test multi-tenant isolation
3. Validate performance with realistic data volumes