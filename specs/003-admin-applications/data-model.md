# Data Model: Admin Applications Management

**Date**: 2025-09-24  
**Feature**: `/admin/applications` page  
**Dependencies**: Extends existing users, children tables; creates applications, enrollments tables

## Core Entities

### 1. Application
Primary entity representing a school application submitted by prospective families.

**Table**: `applications`

**Fields**:
- `id` (UUID, Primary Key) - Unique application identifier
- `schoolId` (UUID, Foreign Key) - Multi-tenant scoping to school
- `parentName` (VARCHAR(255), Not Null) - Parent/guardian full name
- `parentEmail` (VARCHAR(255), Not Null) - Parent contact email (must be unique within school)
- `parentPhone` (VARCHAR(20), Nullable) - Parent contact phone number
- `childName` (VARCHAR(255), Not Null) - Child's full name
- `childDateOfBirth` (DATE, Not Null) - Child's birth date
- `childGender` (ENUM, Nullable) - Child's gender (optional)
- `programRequested` (VARCHAR(100), Not Null) - Requested program/grade level
- `preferredStartDate` (DATE, Nullable) - When family wants to start
- `status` (ENUM, Not Null, Default: 'pending') - Application status
- `rejectionReason` (TEXT, Nullable) - Optional reason when rejected
- `notes` (TEXT, Nullable) - Internal admin notes
- `createdAt` (TIMESTAMP, Not Null) - Application submission timestamp
- `updatedAt` (TIMESTAMP, Not Null) - Last modification timestamp
- `approvedAt` (TIMESTAMP, Nullable) - When application was approved
- `approvedBy` (UUID, Foreign Key, Nullable) - Admin user who approved
- `rejectedAt` (TIMESTAMP, Nullable) - When application was rejected
- `rejectedBy` (UUID, Foreign Key, Nullable) - Admin user who rejected

**Indexes**:
- Primary: `id`
- Multi-tenant: `schoolId`
- Filtering: `status`
- Search: `parentName`, `childName`
- Performance: `(schoolId, status, createdAt)`

**Status Enum Values**:
```typescript
export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
```

**Status Transitions**:
- `pending` → `approved` (creates parent user + child record + enrollment)
- `pending` → `rejected` (updates status only)
- `approved`/`rejected` → No further transitions (final states)

### 2. Parent User Account (extends existing `users` table)
Extends existing users table to support Parent role accounts created during approval.

**Additional Parent-Specific Fields**:
- `applicationId` (UUID, Foreign Key, Nullable) - Links back to originating application
- `isFromApplication` (BOOLEAN, Default: false) - Distinguishes application-generated users

**Role Assignment**: `Parent` (from existing role enum)

**Creation Trigger**: Automatically created when application is approved

### 3. Child Record (extends existing `children` table)
Extends existing children table with application-sourced data.

**Additional Application-Specific Fields**:
- `applicationId` (UUID, Foreign Key, Nullable) - Links back to originating application
- `enrollmentStatus` (ENUM, Default: 'enrolled') - Current enrollment status

**Parent Relationship**: `parentId` (existing field) links to created parent user

**Creation Trigger**: Automatically created when application is approved

### 4. Enrollment
New entity representing the relationship between parent, child, and school program.

**Table**: `enrollments`

**Fields**:
- `id` (UUID, Primary Key) - Unique enrollment identifier
- `schoolId` (UUID, Foreign Key) - Multi-tenant scoping
- `applicationId` (UUID, Foreign Key) - Originating application
- `parentId` (UUID, Foreign Key) - Parent user account
- `childId` (UUID, Foreign Key) - Child record
- `programId` (UUID, Foreign Key, Nullable) - Program/grade level (if applicable)
- `status` (ENUM, Not Null, Default: 'active') - Enrollment status
- `startDate` (DATE, Nullable) - Enrollment start date
- `endDate` (DATE, Nullable) - Enrollment end date (if applicable)
- `createdAt` (TIMESTAMP, Not Null) - Enrollment creation timestamp
- `updatedAt` (TIMESTAMP, Not Null) - Last modification timestamp

**Enrollment Status Enum Values**:
```typescript
export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred'
}
```

## Relationships

### Application → Users (Parent)
- One application can create one parent user account upon approval
- Parent user references application via `applicationId`
- Relationship: `applications.id` ← `users.applicationId`

### Application → Children
- One application creates one child record upon approval
- Child references application via `applicationId`
- Relationship: `applications.id` ← `children.applicationId`

### Parent User → Child
- Standard parent-child relationship from existing schema
- One parent can have multiple children (existing relationship)
- Relationship: `users.id` ← `children.parentId`

### Application → Enrollment
- One application creates one enrollment record upon approval
- Enrollment references all related entities
- Relationship: `applications.id` ← `enrollments.applicationId`

### Multi-Tenant Scoping
All entities include `schoolId` for proper tenant isolation:
- Applications are scoped by school
- Enrollments are scoped by school
- Users and children maintain existing school scoping

## Validation Rules

### Application Validation
- `parentEmail` must be unique within school (not globally)
- `childDateOfBirth` must be valid date, not in future
- `programRequested` must match available programs
- `status` transitions follow defined state machine

### Approval Validation
- Parent email must not already exist in system
- Child name + parent combination should be unique
- All required fields must be present for user/child creation

### Multi-Tenant Validation
- All queries must include `schoolId` filter
- Cross-tenant data access is prevented at database level
- Admin users can only access applications for their school

## Audit Requirements

### Action Logging
All application status changes logged to `access_logs`:
- Application approval with admin user ID
- Application rejection with admin user ID and reason
- Parent account creation from application
- Child record creation from application

### Data Retention
- Applications remain in database indefinitely for audit purposes
- Rejected applications retain all original data
- Status history is preserved through timestamps and user references

## Performance Considerations

### Database Indexes
- Composite index on `(schoolId, status, createdAt)` for efficient filtering
- Individual indexes on `parentName`, `childName` for search
- Foreign key indexes for relationship queries

### Query Optimization
- Pagination uses LIMIT/OFFSET with proper indexing
- Search queries use ILIKE with indexes
- Count queries use same WHERE conditions as data queries

### Caching Strategy
- Application lists can be cached briefly (5 minutes) per school
- Status counts for dashboard metrics
- No caching during active approval workflows