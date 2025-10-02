# Teacher Module Route Contracts

## Page Routes

### `/teacher/dashboard`
**Method**: GET  
**Authentication**: Required (Teacher role)  
**Response**: Server-rendered Teacher dashboard page  
**Redirect Conditions**:
- Not authenticated → `/sign-in`
- Not Teacher role → `/unauthorized`

### `/teacher/students`
**Method**: GET  
**Authentication**: Required (Teacher role)  
**Response**: Server-rendered student roster page  
**Query Parameters**:
- `status`: Filter by enrollment status (optional)
- `group`: Filter by class group (optional)  
**Redirect Conditions**:
- Not authenticated → `/sign-in`
- Not Teacher role → `/unauthorized`

## Component Contracts

### TeacherDashboard Component
**Props**:
```typescript
interface TeacherDashboardProps {
  teacherId: string;
  metrics: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
  };
  lastUpdated: Date;
}
```

### StudentRoster Component
**Props**:
```typescript
interface StudentRosterProps {
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'WITHDRAWN';
    classGroup?: string;
    assignedAt: Date;
    statusUpdatedAt: Date;
  }>;
  classGroups: string[];
  currentFilters: {
    status?: string;
    group?: string;
  };
}
```

### TeacherNavigation Component
**Props**:
```typescript
interface TeacherNavigationProps {
  currentPath: string;
  teacherName: string;
  menuItems: Array<{
    label: string;
    href: string;
    icon?: string;
    isActive: boolean;
  }>;
}
```

## Middleware Contracts

### Teacher Role Guard
**Input**: Request with session  
**Output**: Continue | Redirect  
**Logic**:
```typescript
if (!session) return redirect('/sign-in');
if (session.user.role !== 'TEACHER') return redirect('/unauthorized');
if (!isTeacherRoute(pathname)) return redirect('/teacher/dashboard');
```

### Multi-Tenant Scope
**Input**: Teacher session + database query  
**Output**: Scoped query with schoolId filter  
**Logic**:
```typescript
const scopedQuery = query.where(
  and(
    eq(table.schoolId, session.user.schoolId),
    ...additionalFilters
  )
);
```

## Error Handling Contracts

### Authentication Errors
- **401 Unauthorized**: No valid session → Redirect to `/sign-in`
- **403 Forbidden**: Invalid role → Redirect to `/unauthorized`

### Data Access Errors
- **404 Not Found**: Teacher has no assignments → Show empty state
- **500 Server Error**: Database/query errors → Show error page

### Validation Errors
- **400 Bad Request**: Invalid query parameters → Show validation message

## Security Contracts

### RBAC Enforcement
- All Teacher routes require `TEACHER` role
- Database queries scoped to authenticated user's school
- Access logging for all Teacher actions

### Data Isolation
- Teachers can only access their assigned students
- Students filtered by teacher assignment relationship
- All queries include multi-tenant schoolId scope

### Session Management
- JWT token validation on all requests
- Role change invalidates existing sessions
- Session timeout handling with appropriate redirects