# Data Model: Admin Enrollments Management

**Date**: September 27, 2025  
**Feature**: Admin Enrollments Management  
**Context**: PostgreSQL with Drizzle ORM, Multi-tenant SaaS

## Entity Definitions

### Enrollment Entity

**Purpose**: Represents a student's enrollment in the school/program with lifecycle management

**Fields**:
- `id` (UUID, Primary Key): Unique identifier for enrollment record
- `child_id` (UUID, Foreign Key → children.id, NOT NULL): Reference to child record
- `school_id` (UUID, Foreign Key → schools.id, NOT NULL): Tenant scoping identifier  
- `status` (EnrollmentStatus enum, NOT NULL): Current enrollment state
- `enrollment_date` (Date, NOT NULL): Date when enrollment became active
- `withdrawal_date` (Date, nullable): Date when enrollment was withdrawn (if applicable)
- `notes` (Text, nullable): Administrative notes about the enrollment
- `created_at` (Timestamp, NOT NULL): Record creation timestamp
- `updated_at` (Timestamp, NOT NULL): Last modification timestamp
- `created_by` (UUID, Foreign Key → users.id, NOT NULL): Admin who created enrollment
- `updated_by` (UUID, Foreign Key → users.id, NOT NULL): Admin who last modified enrollment

**Indexes**:
- Primary: `id`
- Unique: `(child_id, school_id)` WHERE status = 'active' (prevents duplicate active enrollments)
- Tenant: `(school_id, status, enrollment_date)` (for filtering and listing)
- Foreign Keys: `child_id`, `school_id`, `created_by`, `updated_by`

### Child Entity (Extended)

**Purpose**: Student profile with personal and family information (existing table, extensions noted)

**Key Fields** (relevant to enrollments):
- `id` (UUID, Primary Key): Unique identifier
- `school_id` (UUID, Foreign Key): Tenant scoping
- `first_name` (VARCHAR, NOT NULL): Child's first name
- `last_name` (VARCHAR, NOT NULL): Child's last name  
- `date_of_birth` (Date, NOT NULL): Child's birth date
- `parent_name` (VARCHAR, NOT NULL): Primary parent/guardian name
- `parent_email` (VARCHAR): Parent contact email
- `parent_phone` (VARCHAR): Parent contact phone
- `is_active` (Boolean, NOT NULL): Child record active status

**Constraints**:
- Cannot be deleted if associated enrollments exist (referential integrity)
- Must be complete profile before enrollment creation (validation)

### EnrollmentStatus Enum

**Values**:
- `'active'`: Currently enrolled and participating
- `'withdrawn'`: Enrollment ended by admin action (soft delete)
- `'inactive'`: Temporarily inactive (e.g., extended absence)
- `'archived'`: Historical enrollment (system archival)

**Validation Rules**:
- Only one 'active' enrollment per child per school
- 'withdrawn' status requires withdrawal_date
- Status transitions: active ↔ inactive → withdrawn → archived

## Relationships

### Enrollment → Child (Many-to-One)
- **Type**: Required foreign key relationship
- **Constraint**: `enrollments.child_id → children.id`
- **Business Rule**: Each enrollment must be associated with exactly one child
- **Cascade**: RESTRICT (prevent child deletion if enrollments exist)

### Enrollment → School (Many-to-One)  
- **Type**: Required foreign key relationship
- **Constraint**: `enrollments.school_id → schools.id`
- **Business Rule**: Multi-tenant scoping, all queries must filter by school
- **Cascade**: RESTRICT (prevent school deletion if enrollments exist)

### Enrollment → User (Many-to-One, Audit)
- **Type**: Foreign key for audit trail
- **Constraints**: `enrollments.created_by → users.id`, `enrollments.updated_by → users.id`
- **Business Rule**: Track admin actions for compliance
- **Cascade**: RESTRICT (preserve audit trail)

## State Transitions

### Enrollment Lifecycle
```
[NEW] → active → withdrawn → archived
         ↕
      inactive
```

**Allowed Transitions**:
1. `NEW → active`: Initial enrollment creation
2. `active → inactive`: Temporary suspension (reversible)
3. `inactive → active`: Reactivation from suspension  
4. `active → withdrawn`: Permanent withdrawal (admin action)
5. `inactive → withdrawn`: Withdrawal from inactive state
6. `withdrawn → archived`: System archival (automated or manual)

**Forbidden Transitions**:
- `withdrawn → active`: Cannot reactivate withdrawn enrollments
- `archived → any`: Archived enrollments are immutable
- Direct transitions skipping states

## Validation Rules

### Business Rules
1. **Duplicate Prevention**: Only one active enrollment per child per school
2. **Profile Completeness**: Child must have complete profile before enrollment
3. **Status Consistency**: withdrawal_date required when status = 'withdrawn'
4. **Audit Trail**: created_by and updated_by must be valid admin users
5. **Tenant Scoping**: enrollment.school_id must match child.school_id

### Data Integrity  
1. **Foreign Keys**: All references must exist and be active
2. **Date Logic**: enrollment_date ≤ withdrawal_date (when present)
3. **Status Enum**: Only valid status values allowed
4. **Required Fields**: Non-nullable fields must have values
5. **Unique Constraints**: Prevent duplicate active enrollments

### Security Constraints
1. **Multi-Tenant**: All queries must include school_id filter
2. **RBAC**: Only admins can create/modify enrollments
3. **Audit**: All changes logged with user identification
4. **Data Protection**: Child data access restricted by school association

## Performance Considerations

### Indexing Strategy
- **Primary Queries**: List enrollments by school + status (compound index)
- **Search Queries**: Child name lookup via join (index on child names)
- **Audit Queries**: Created/updated by admin (index on user fields)
- **Uniqueness**: Unique constraint on (child_id, school_id) for active enrollments

### Query Optimization
- **Batch Operations**: Use joins to fetch enrollment + child data together
- **Pagination**: Implement cursor-based pagination for large result sets
- **Filtering**: Efficient status and date range filtering with indexes
- **Tenant Isolation**: School_id filter applied at query level, not application level

### Scalability Notes
- **Partitioning**: Consider partitioning by school_id for very large deployments
- **Archival**: Implement automated archival strategy for old withdrawn enrollments  
- **Caching**: Cache frequently accessed child profile data
- **Monitoring**: Track query performance and slow query alerts