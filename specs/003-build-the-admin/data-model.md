# Data Model: Admin Applications Management

## Core Entities

### Application Entity
**Purpose**: Represents a student admission request submitted by parents/guardians

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key, Multi-tenant scoping)
- `status`: Enum (`PENDING`, `APPROVED`, `REJECTED`)
- `submitted_at`: Timestamp (ISO 8601)
- `processed_at`: Timestamp (nullable, set when approved/rejected)
- `processed_by_admin_id`: UUID (nullable, Foreign Key to User)

**Child Information**:
- `child_first_name`: String (required)
- `child_last_name`: String (required) 
- `child_date_of_birth`: Date (required)
- `child_gender`: String (optional)
- `preferred_start_date`: Date (required)
- `special_needs`: Text (optional)
- `medical_conditions`: Text (optional)

**Parent/Guardian Information** (supports up to 2 parents):
- `parent1_first_name`: String (required)
- `parent1_last_name`: String (required)
- `parent1_email`: String (required, used for profile matching)
- `parent1_phone`: String (optional)
- `parent1_relationship`: Enum (`MOTHER`, `FATHER`, `GUARDIAN`, `OTHER`)
- `parent2_first_name`: String (optional)
- `parent2_last_name`: String (optional)
- `parent2_email`: String (optional, used for profile matching)
- `parent2_phone`: String (optional)
- `parent2_relationship`: Enum (same as parent1)

**Metadata**:
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Validation Rules**:
- Status transitions: `PENDING` → `APPROVED`/`REJECTED` only
- Once `APPROVED` or `REJECTED`, status cannot change
- `processed_at` and `processed_by_admin_id` must be set together
- At least one parent must have complete information (name + email)
- Child age must be appropriate for school programs (0-6 years)

**Multi-Tenant Scoping**: All queries filtered by `school_id`

### Child Profile Entity  
**Purpose**: Student record created from approved applications

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key, Multi-tenant scoping)
- `application_id`: UUID (Foreign Key, nullable for direct creation)
- `first_name`: String (required)
- `last_name`: String (required)
- `date_of_birth`: Date (required)
- `gender`: String (optional)
- `enrollment_status`: Enum (`ACTIVE`, `INACTIVE`, `WAITLISTED`)
- `start_date`: Date (required)
- `special_needs`: Text (optional)
- `medical_conditions`: Text (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `created_by_admin_id`: UUID (Foreign Key to User)

**Relationships**:
- One-to-many with ParentChildRelationship
- Many-to-one with Application (optional)
- Many-to-one with User (creator)

**Validation Rules**:
- Must have 1-2 linked parents through ParentChildRelationship
- If created from application, data must match application child fields
- Start date cannot be in the past
- Cannot delete if has active enrollment records

### Parent Profile Entity
**Purpose**: Guardian information, either created from applications or pre-existing

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key, Multi-tenant scoping)  
- `first_name`: String (required)
- `last_name`: String (required)
- `email`: String (required, unique per school)
- `phone`: String (optional)
- `address`: Text (optional)
- `emergency_contact`: Boolean (default: true)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- One-to-many with ParentChildRelationship
- One-to-many with AccessLog (for audit trail)

**Validation Rules**:
- Email must be unique within school_id scope
- Cannot delete if linked to active children
- Phone format validation (if provided)
- Email format validation required

### Parent-Child Relationship Entity
**Purpose**: Links parents to children with relationship context

**Fields**:
- `id`: UUID (Primary Key) 
- `school_id`: UUID (Foreign Key, Multi-tenant scoping)
- `parent_id`: UUID (Foreign Key)
- `child_id`: UUID (Foreign Key)
- `relationship_type`: Enum (`MOTHER`, `FATHER`, `GUARDIAN`, `OTHER`)
- `primary_contact`: Boolean (default: false)
- `pickup_authorized`: Boolean (default: true)
- `created_at`: Timestamp

**Validation Rules**:
- Maximum 2 relationships per child_id
- Unique constraint on (parent_id, child_id)
- At least one relationship must have primary_contact = true per child
- Cannot delete if child is actively enrolled

### Access Log Entity  
**Purpose**: Audit trail for all admin actions on applications

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key, Multi-tenant scoping)
- `admin_user_id`: UUID (Foreign Key to User)
- `action_type`: Enum (`APPLICATION_APPROVED`, `APPLICATION_REJECTED`, `CHILD_CREATED`, `APPLICATION_VIEWED`)
- `target_type`: Enum (`APPLICATION`, `CHILD`, `PARENT`)
- `target_id`: UUID (ID of the affected entity)
- `details`: JSON (action-specific metadata)
- `timestamp`: Timestamp
- `ip_address`: String (optional)
- `user_agent`: String (optional)

**Validation Rules**:
- Cannot modify or delete log entries (append-only)
- All admin actions must generate corresponding log entries
- Details JSON must include relevant context for audit purposes

## Entity Relationships

### Application Processing Flow
```
Application (PENDING) 
    ↓ [Admin Action: Approve]
    ├── Child Profile (created)
    ├── Parent Profile(s) (created or linked)
    ├── Parent-Child Relationship(s) (created)  
    ├── Application (status → APPROVED)
    └── Access Log (action recorded)
```

### Direct Child Creation Flow  
```
Admin Action: Add Child
    ↓
    ├── Child Profile (created, no application_id)
    ├── Parent Profile(s) (created or linked)
    ├── Parent-Child Relationship(s) (created)
    └── Access Log (action recorded)
```

### Parent Profile Linking Logic
```
For each parent in application:
    1. Check if Parent Profile exists with matching email + school_id
    2. If exists: Link via Parent-Child Relationship
    3. If not exists: Create new Parent Profile, then link
    4. Ensure maximum 2 parents per child
    5. Log all creation/linking actions
```

## Database Schema Considerations

### Indexing Strategy
- Primary keys: UUID with B-tree indexes
- Multi-tenant filtering: Composite indexes on (school_id, other_commonly_queried_fields)  
- Application listing: Index on (school_id, status, submitted_at)
- Parent lookup: Index on (school_id, email)
- Audit queries: Index on (school_id, timestamp, admin_user_id)

### Performance Optimization
- Application list queries use pagination with LIMIT/OFFSET
- Parent matching uses exact email match to leverage indexes
- Child profile queries batched when possible
- Access log writes are async to avoid blocking user actions

### Data Consistency
- Foreign key constraints enforce referential integrity
- Check constraints validate enum values and business rules
- Transaction boundaries ensure atomic application processing
- Optimistic locking on critical entities prevents race conditions

## Migration Strategy

### Phase 1: Core Tables
1. Create Application table with all fields
2. Create Child Profile table
3. Create Parent Profile table  
4. Create Parent-Child Relationship table
5. Create Access Log table

### Phase 2: Constraints and Indexes
1. Add foreign key constraints
2. Add unique constraints (email per school, parent-child relationships)
3. Add check constraints (status transitions, parent limits)
4. Create performance indexes

### Phase 3: Seed Data
1. Create application status enums
2. Create relationship type enums  
3. Create action type enums
4. Set up initial admin user roles (if not existing)

This data model supports all functional requirements while maintaining multi-tenant security, audit compliance, and performance optimization for the admin applications management feature.