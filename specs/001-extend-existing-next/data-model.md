# Data Model: Role-Based Access Control

## User Role Enum

```typescript
enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher', 
  ADMIN = 'admin'
}
```

**Attributes**:
- `PARENT`: Default role for new user accounts, limited to student/family views
- `TEACHER`: Access to classroom management and student progress features  
- `ADMIN`: Full access including administrative functions and user management

**Validation Rules**:
- Must be one of the three defined enum values
- Cannot be null or undefined
- Database constraint enforces enum values
- Default value: `PARENT` for new users

**State Transitions**:
- New user → `PARENT` (automatic on account creation)
- `PARENT` → `TEACHER` or `ADMIN` (Admin assignment only)
- `TEACHER` → `PARENT` or `ADMIN` (Admin assignment only)  
- `ADMIN` → `PARENT` or `TEACHER` (Admin assignment only)
- Role changes trigger session invalidation on next navigation

## Extended User Entity

**Primary Fields**:
- `id`: Unique identifier (existing field)
- `email`: User email address (existing field)
- `name`: Display name (existing field)
- `role`: UserRole enum (new field) - defaults to PARENT
- `teamId`: Multi-tenant school/organization ID (existing field)
- `sessionVersion`: Integer counter for session invalidation (new field)

**Relationships**:
- Belongs to Team (school/organization) - existing relationship
- One-to-many with AccessLog entries - new relationship

**Database Schema Changes**:
```sql
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'parent' NOT NULL;
ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 1 NOT NULL;
CREATE TYPE user_role AS ENUM ('parent', 'teacher', 'admin');
```

## Access Log Entity

**Fields**:
- `id`: Primary key, UUID
- `userId`: Foreign key to users table
- `teamId`: Multi-tenant scope (inherited from user)
- `route`: Requested route path (e.g., '/admin/users')
- `success`: Boolean indicating access granted/denied
- `timestamp`: ISO datetime of access attempt
- `userAgent`: Optional client identification
- `ipAddress`: Optional request source IP

**Validation Rules**:
- `userId` must reference existing user
- `teamId` must match user's team for data isolation
- `route` must be non-empty string
- `success` required boolean value
- `timestamp` automatically set on creation

**Relationships**:
- Belongs to User (many-to-one)
- Scoped by Team for multi-tenant isolation

## Session Context Extension

**Extended Session Object**:
```typescript
interface ExtendedSession {
  user: {
    id: string
    email: string  
    name: string
    role: UserRole
    teamId: string
    sessionVersion: number
  }
}
```

**JWT Token Extension**:
```typescript
interface ExtendedJWT {
  sub: string // user ID
  email: string
  name: string  
  role: UserRole
  teamId: string
  sessionVersion: number
}
```

**Lifecycle**:
- Created on successful authentication
- Role and sessionVersion populated from database
- Validated on each protected route access
- Invalidated when sessionVersion increments (role change)

## Route Protection Rules

**Protected Patterns**:
- `/admin/*` - Requires ADMIN role
- Future: `/teacher/*` - Will require TEACHER or ADMIN role
- Future: `/parent/*` - Will require any authenticated role

**Access Matrix**:
| Route Pattern | Parent | Teacher | Admin |
|---------------|---------|---------|-------|
| `/admin/*`    | ❌      | ❌       | ✅     |
| `/dashboard`  | ✅      | ✅       | ✅     |
| `/profile`    | ✅      | ✅       | ✅     |

**Validation Logic**:
1. Check user authentication status
2. Extract role from session
3. Match route pattern to required role
4. Log access attempt with success/failure
5. Allow access or redirect to `/unauthorized`