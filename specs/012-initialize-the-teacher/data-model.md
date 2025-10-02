# Data Model: Teacher Module

## Core Entities

### Teacher
**Description**: User with Teacher role who can access assigned students
**Fields**:
- `id`: Primary key (UUID)
- `userId`: Reference to existing user table
- `schoolId`: Multi-tenant scope (UUID)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships**:
- One-to-Many with TeacherStudentAssignment
- Many-to-One with School (via schoolId)
- One-to-One with User (via userId)

### TeacherStudentAssignment
**Description**: Many-to-many relationship between Teachers and Students
**Fields**:
- `id`: Primary key (UUID)
- `teacherId`: Reference to Teacher (UUID)
- `studentId`: Reference to Student (UUID)
- `classGroup`: Optional class/group identifier (string)
- `assignedAt`: Timestamp
- `isActive`: Boolean status
- `createdAt`: Timestamp

**Relationships**:
- Many-to-One with Teacher
- Many-to-One with Student

### Student (Existing Entity Extensions)
**Description**: Existing student entity with status tracking
**New Fields** (if not existing):
- `enrollmentStatus`: Enum (ACTIVE, INACTIVE, GRADUATED, WITHDRAWN)
- `statusUpdatedAt`: Timestamp

**Validation Rules**:
- `enrollmentStatus` must be one of defined enum values
- `statusUpdatedAt` automatically updated on status change

## Multi-Tenant Scoping

### Security Rules
- All Teacher queries MUST include `schoolId` filter
- TeacherStudentAssignment queries MUST verify both Teacher and Student belong to same school
- Student data MUST be filtered by Teacher assignment relationship

### Query Patterns
```typescript
// Teacher dashboard data
const teacherStudents = await db.query.teacherStudentAssignments.findMany({
  where: and(
    eq(teacherStudentAssignments.teacherId, teacherId),
    eq(teachers.schoolId, currentUser.schoolId)
  ),
  with: {
    student: true
  }
});

// Student roster with status
const roster = await db.query.students.findMany({
  where: and(
    inArray(students.id, assignedStudentIds),
    eq(students.schoolId, currentUser.schoolId)
  )
});
```

## State Transitions

### Student Enrollment Status
- ACTIVE → INACTIVE: Student temporarily not attending
- ACTIVE → GRADUATED: Student completed program
- ACTIVE → WITHDRAWN: Student permanently left
- INACTIVE → ACTIVE: Student returns to program
- All transitions logged in access_logs

### Teacher Assignment Status
- isActive: true → false: Teacher no longer assigned to student
- Assignment changes logged for audit compliance

## Access Patterns

### Teacher Dashboard Metrics
- Count of active students assigned to teacher
- Count of inactive students assigned to teacher
- Recent status changes (last 30 days)
- All scoped to teacher's school and assignments

### Student Roster Display
- All students assigned to teacher (active and inactive)
- Status indicators for each student
- Class/group grouping if applicable
- Filtered by teacher's school tenant

## Database Constraints

### Primary Constraints
- `teacherId + studentId` unique constraint in TeacherStudentAssignment
- `userId` unique constraint in Teacher table (one teacher record per user)
- Foreign key constraints with CASCADE delete behavior

### Index Requirements
- Index on `teacherId` in TeacherStudentAssignment
- Index on `schoolId + teacherId` for multi-tenant queries
- Index on `studentId + enrollmentStatus` for roster filtering

## Validation Rules

### Teacher Assignment Rules
- Teacher can only be assigned students from same school
- Assignment must have valid teacherId and studentId
- Assignment creation logged in access_logs

### Data Integrity Rules
- Student status changes require valid enum values
- Teacher assignments require active teacher and valid student
- All operations scoped to authenticated user's school