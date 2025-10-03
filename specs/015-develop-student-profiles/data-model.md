# Data Model: Student Profiles & Observations

## Entity Definitions

### Observation (New Entity)
**Purpose**: Store timestamped teacher notes about student activities and progress

**Fields**:
- `id`: UUID (Primary Key)
- `studentId`: UUID (Foreign Key → children.id)
- `teacherId`: UUID (Foreign Key → users.id)
- `note`: TEXT (Observation content)
- `createdAt`: TIMESTAMP (Creation time)
- `updatedAt`: TIMESTAMP (Last modification time)

**Validation Rules**:
- `note` must not be empty (minimum 1 character)
- `studentId` must reference existing child
- `teacherId` must reference existing user with Teacher role
- `createdAt` and `updatedAt` are system-managed timestamps

**Indexes**:
- Primary: `id`
- Query optimization: `(studentId, createdAt DESC)` for chronological lists
- Security: `(teacherId)` for teacher-scoped queries

### Student/Child (Existing Entity - Extended Usage)
**Purpose**: Core student information linked with enrollment data

**Relevant Fields** (from existing schema):
- `id`: UUID (Primary Key)
- `firstName`: VARCHAR
- `lastName`: VARCHAR  
- `dateOfBirth`: DATE
- `schoolId`: UUID (Multi-tenant scoping)

**New Relationships**:
- `observations`: One-to-Many relationship with Observation entity

### Enrollment (Existing Entity - Extended Usage)
**Purpose**: Student enrollment and assignment information

**Relevant Fields** (from existing schema):
- `id`: UUID (Primary Key)
- `childId`: UUID (Foreign Key → children.id)
- `schoolId`: UUID (Multi-tenant scoping)
- `status`: ENUM (enrollment status)
- `enrollmentDate`: DATE

### User/Teacher (Existing Entity - Extended Usage)
**Purpose**: Teacher user accounts with role-based access

**Relevant Fields** (from existing schema):
- `id`: UUID (Primary Key)
- `email`: VARCHAR
- `role`: ENUM (must be 'TEACHER' for access)
- `schoolId`: UUID (Multi-tenant scoping)

**New Relationships**:
- `observations`: One-to-Many relationship with Observation entity

## Relationships

### Primary Relationships
1. **Teacher → Observations**: One-to-Many
   - A Teacher can create multiple observations
   - Each observation belongs to exactly one creating Teacher

2. **Student → Observations**: One-to-Many  
   - A Student can have multiple observations from different Teachers
   - Each observation is about exactly one Student

3. **Teacher → Students**: Many-to-Many (via school assignments)
   - Teachers access students through school-based assignments
   - Students can be observed by multiple Teachers

### Data Access Patterns

#### Teacher Dashboard Query
```
Query: All students assigned to authenticated Teacher
Scope: School-based multi-tenant filtering
Result: Student list with basic information
```

#### Student Profile Query
```
Query: Single student details + enrollment information
Scope: Teacher must have access to student via school assignment
Result: Complete student profile data
```

#### Observations Query
```
Query: All observations for specific student, ordered chronologically
Scope: Teacher must have access to student
Result: Paginated observation list (most recent first)
```

#### Observation Creation
```
Action: Create new observation
Validation: Teacher has student access, note is not empty
Result: New observation with timestamps
```

#### Observation Update
```
Action: Update existing observation
Validation: Teacher has student access, observation exists
Result: Updated observation with new updatedAt timestamp
```

## State Transitions

### Observation Lifecycle
1. **Creation**: Teacher creates observation with initial note
2. **Active**: Observation exists and can be viewed/edited
3. **Updated**: Observation content modified (preserves creation time, updates modification time)
4. **Permanent**: No deletion - observations persist for historical record

### Access State Management
- **Teacher Assignment**: Dynamic based on school enrollment and teacher assignments
- **Student Visibility**: Controlled by multi-tenant school scoping
- **Observation Permissions**: Based on teacher-student access relationship

## Multi-Tenant Security

### Tenant Scoping Rules
1. All queries scoped by `schoolId` to ensure data isolation
2. Teacher-student relationships verified before observation access
3. Cross-tenant data access strictly prohibited

### Access Control Matrix
| Actor | Student List | Student Profile | Create Observation | Edit Observation |
|-------|-------------|----------------|-------------------|------------------|
| Teacher (same school) | ✅ Assigned only | ✅ Assigned only | ✅ Any assigned | ✅ Any assigned |
| Teacher (other school) | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ All in school | ✅ All in school | ❌ | ❌ |
| Parent | ❌ | ❌ | ❌ | ❌ |

## Performance Considerations

### Indexing Strategy
- `observations(studentId, createdAt DESC)`: Optimizes chronological observation lists
- `observations(teacherId)`: Supports teacher-scoped queries for access logging
- Existing indexes on `children(schoolId)` and `users(schoolId)` for multi-tenant scoping

### Query Optimization
- Batch student lists in single query with enrollment joins
- Separate observation queries to avoid N+1 problems
- Pagination for extensive observation histories
- Prepared statements for parameterized security filtering